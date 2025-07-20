#!/bin/bash

DEVICE="/dev/ttyUSB0"
LOG="battery.log"
SCREEN_SESSION="battery_session"

# Gist info
FILENAME="battery_data.json"

REPO="szlaskidaniel/battery-status"
FILE_PATH="status.json"

# Check if screen is available
if ! command -v screen &> /dev/null; then
    echo "Error: screen command not found. Please install screen package."
    exit 1
fi

# Check if device exists
if [[ ! -e "$DEVICE" ]]; then
    echo "Error: Device $DEVICE not found."
    exit 1
fi

> "$LOG"  # Clear the log file

# Function to setup screen session with proper serial connection
setup_screen_session() {
    echo "Setting up screen session..." | tee -a "$LOG"
    
    # Kill any existing screen session
    screen -S "$SCREEN_SESSION" -X quit 2>/dev/null || true
    sleep 1
    
    # Start new screen session with serial settings
    # 9600 baud, 8 data bits, no parity, 1 stop bit
    screen -dmS "$SCREEN_SESSION" "$DEVICE" 9600,cs8,-parenb,-cstopb
    sleep 2
    
    # Send initial enter to establish connection (as mentioned in the issue)
    screen -S "$SCREEN_SESSION" -X stuff $'\r'
    sleep 1
    
    echo "Screen session established" | tee -a "$LOG"
}

# Function to send a command and log response using screen
send_command() {
    local CMD="$1"
    echo "--- Sending: $CMD ---" | tee -a "$LOG"
    
    # Clear screen buffer and send command
    screen -S "$SCREEN_SESSION" -X stuff "$CMD"$'\r'
    sleep 2
    
    # Capture the output using screen hardcopy
    local TEMP_OUTPUT="/tmp/screen_output_$$"
    screen -S "$SCREEN_SESSION" -X hardcopy "$TEMP_OUTPUT"
    
    if [[ -f "$TEMP_OUTPUT" ]]; then
        cat "$TEMP_OUTPUT" | tee -a "$LOG"
        rm -f "$TEMP_OUTPUT"
    else
        echo "Warning: No output captured" | tee -a "$LOG"
    fi
    
    echo -e "\n" | tee -a "$LOG"
}

# Function to cleanup screen session
cleanup_screen_session() {
    echo "Cleaning up screen session..." | tee -a "$LOG"
    screen -S "$SCREEN_SESSION" -X quit 2>/dev/null || true
}

# Setup screen session for serial communication
setup_screen_session

# Commands to run
COMMANDS=("pwr")
for cmd in "${COMMANDS[@]}"; do
    send_command "$cmd"
done

# Cleanup screen session
cleanup_screen_session

# Extract values with retry logic
MAX_RETRIES=3
RETRY_COUNT=0

while [[ $RETRY_COUNT -lt $MAX_RETRIES ]]; do
    DATA_LINE=$(grep -A1 "Volt.St" "$LOG" | tail -n1)
    
    if [[ -n "$DATA_LINE" ]]; then
        echo "Data found on attempt $((RETRY_COUNT + 1))" | tee -a "$LOG"
        break
    else
        echo "No data line found in log on attempt $((RETRY_COUNT + 1)). Retrying..." | tee -a "$LOG"
        RETRY_COUNT=$((RETRY_COUNT + 1))
        
        if [[ $RETRY_COUNT -lt $MAX_RETRIES ]]; then
            echo "Retrying with fresh connection..." | tee -a "$LOG"
            setup_screen_session
            for cmd in "${COMMANDS[@]}"; do
                send_command "$cmd"
            done
            cleanup_screen_session
            sleep 2
        fi
    fi
done

if [[ -z "$DATA_LINE" ]]; then
    echo "No data line found in log after $MAX_RETRIES attempts."
    exit 1
fi

VOLT=$(echo "$DATA_LINE" | awk '{print $1}')
CURR=$(echo "$DATA_LINE" | awk '{print $2}')
SOC=$(echo "$DATA_LINE" | grep -o '[0-9]\+%' | head -n1 | tr -d '%')

VOLT_FLOAT=$(awk "BEGIN { printf \"%.3f\", $VOLT / 1000 }")
CURR_FLOAT=$(awk "BEGIN { printf \"%.3f\", $CURR / 1000 }")
POWER_FLOAT=$(awk "BEGIN { printf \"%.1f\", $VOLT * $CURR / 1000000 }")

# Build new JSON content
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
JSON=$(cat <<EOF
{
  "Volt": $VOLT_FLOAT,
  "Curr": $CURR_FLOAT,
  "Power": $POWER_FLOAT,
  "SOC": $SOC,
  "Timestamp": "$TIMESTAMP"
}
EOF
)
# Save JSON to a local file
echo "$JSON" > "$FILENAME"

# Upload to S3
aws s3 cp "$FILENAME" "s3://pylontech-force-h2-battery/status.json"
