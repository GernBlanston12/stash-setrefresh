#!/bin/bash
# stash-setrefresh.sh
# Usage: stash-setrefresh.sh <output> <resolution> <rate> <ui-scale>
# Example: stash-setrefresh.sh DisplayPort-2 3840x2160 50 2

OUTPUT="$1"
RESOLUTION="$2"
RATE="$3"
SCALE="$4"

if [[ -z "$OUTPUT" || -z "$RESOLUTION" || -z "$RATE" || -z "$SCALE" ]]; then
  echo "Usage: $0 <output> <resolution> <rate> <ui-scale>" >&2
  echo "Example: $0 DisplayPort-2 3840x2160 50 2" >&2
  exit 1
fi

# Set resolution + refresh rate
xrandr --output "$OUTPUT" --mode "$RESOLUTION" --rate "$RATE"

# Set Cinnamon UI scale
gsettings set org.cinnamon.desktop.interface scaling-factor "$SCALE"

echo "Set $OUTPUT to ${RESOLUTION}@${RATE} Hz, UI scale $SCALE"
