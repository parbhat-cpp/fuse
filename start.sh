#!/bin/bash

# Detect env in which this script is executed
detect_env() {
  if grep -qi "microsoft" /proc/version 2>/dev/null; then
    echo "wsl"
  elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "linux"
  else
    echo "unknown"
  fi
}

# create new terminal to run docker command
run_in_new_terminal() {
    local cmd="$*"
    local env_type
    env_type=$(detect_env)

    case "$env_type" in
        wsl)
            if command -v wt.exe &> /dev/null; then
                wt.exe new-tab wsl bash -ic "$cmd"
            else
                echo "Opening Windows CMD fallback..."
                cmd.exe /c start cmd.exe /k "$cmd"
            fi
            ;;
        linux)
            if command -v gnome-terminal &> /dev/null; then
                gnome-terminal -- bash -c "$cmd; exec bash"
            elif command -v konsole &> /dev/null; then
                konsole -e "bash -c '$cmd; exec bash'"
            elif command -v xfce4-terminal &> /dev/null; then
                xfce4-terminal --hold -e "$cmd"
            else
                echo "No compatible terminal found. Running inline"
                bash -c "$cmd"
            fi
            ;;
        *)
            echo "Unknown env"
            bash -c "$cmd"
            ;;
    esac
}

env="$1"
shift
cmd="$*"

# Main CLI
case "$env" in
    dev)
        if [[ "$cmd" == "up" ]]; then
            echo "Starting frontend dev container..."
            run_in_new_terminal "docker compose -f ./frontend/docker-compose.dev.yaml up"
            echo "Starting backend dev container..."
            run_in_new_terminal "docker compose -f ./backend/docker-compose.dev.yaml up"
        elif [[ "$cmd" == "down" ]]; then
            echo "Removing frontend dev container..."
            run_in_new_terminal "docker compose -f ./frontend/docker-compose.dev.yaml down"
            echo "Removing backend dev container..."
            run_in_new_terminal "docker compose -f ./backend/docker-compose.dev.yaml down"
        elif [[ "$cmd" == "build" ]]; then
            echo "Building frontend dev container..."
            run_in_new_terminal "docker compose -f ./frontend/docker-compose.dev.yaml build"
            echo "Building backend dev container..."
            run_in_new_terminal "docker compose -f ./backend/docker-compose.dev.yaml build"
        else
            echo "Invalid dev command" >&2
            exit 1
        fi
        ;;
    prod)
        if [[ "$cmd" == "up" ]]; then
            echo "Starting frontend prod container..."
            run_in_new_terminal "docker compose -f ./frontend/docker-compose.prod.yaml up"
            echo "Starting backend prod container..."
            run_in_new_terminal "docker compose -f ./backend/docker-compose.prod.yaml up"
        elif [[ "$cmd" == "down" ]]; then
            echo "Removing frontend prod container..."
            run_in_new_terminal "docker compose -f ./frontend/docker-compose.prod.yaml down"
            echo "Removing backend prod container..."
            run_in_new_terminal "docker compose -f ./backend/docker-compose.prod.yaml down"
        elif [[ "$cmd" == "build" ]]; then
            echo "Building frontend prod container..."
            run_in_new_terminal "docker compose -f ./frontend/docker-compose.prod.yaml build"
            echo "Building backend prod container..."
            run_in_new_terminal "docker compose -f ./backend/docker-compose.prod.yaml build"
        else
            echo "Invalid prod command" >&2
            exit 1
        fi
        ;;
    *)
        echo "Invalid start command" >&2
        exit 1
        ;;
esac
