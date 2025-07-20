#!/bin/bash


DEVICE="/dev/ttyUSB0"
LOG="battery.log"

# Gist info
FILENAME="battery_data.json"

REPO="szlaskidaniel/battery-status"
FILE_PATH="status.json"


# Check if device exists
if [[ ! -e "$DEVICE" ]]; then
    echo "Error: Device $DEVICE not found."
    exit 1
fi

> "$LOG"  # Clear the log file

# Function to send a command and log response
send_command() {
    local CMD="$1"
    echo "--- Sending: $CMD ---" | tee -a "$LOG"
    printf "$CMD\r" > "$DEVICE"
    timeout 2 cat "$DEVICE" | tee -a "$LOG"
    echo -e "\n" | tee -a "$LOG"
}

# Commands to run
COMMANDS=("info" pwr")

# Retry logic
MAX_RETRIES=3
RETRY_COUNT=0
DATA_LINE=""

while [[ $RETRY_COUNT -lt $MAX_RETRIES ]]; do
    for cmd in "${COMMANDS[@]}"; do
        send_command "$cmd"
    done
    DATA_LINE=$(grep -A1 "Volt.St" "$LOG" | tail -n1)
    if [[ -n "$DATA_LINE" ]]; then
        echo "Data found on attempt $((RETRY_COUNT + 1))" | tee -a "$LOG"
        break
    else
        echo "No data line found in log on attempt $((RETRY_COUNT + 1)). Retrying..." | tee -a "$LOG"
        RETRY_COUNT=$((RETRY_COUNT + 1))
        sleep 2
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