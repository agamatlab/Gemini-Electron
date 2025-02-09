#!/bin/bash

# Use AppleScript to get selected text from the active application
echo "tell application \"System Events\" to keystroke \"c\" using command down" | osascript