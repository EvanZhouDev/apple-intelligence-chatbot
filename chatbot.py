import subprocess
import readline

def ask_ai(user_input):
    formatted_input = f"system A conversation between a user and a helpful understanding assistant. Always answer the user queries and questions. Continue this conversation. {user_input}"

    apple_script_command = f"""
    set a to path to frontmost application as text

    tell application "Notes"
        delay 0.2
        tell account "iCloud"
            set newNote to make new note ¬
            at folder "Apple Intelligence" ¬
            with properties {{name:"Apple Intelligence Chatbot", body:"{formatted_input}"}}

            delay 0.2
            show newNote
            delay 0.2
        end tell
    end tell

    tell application "System Events"
        key code 124
        delay 0.1
        keystroke "a" using {{command down}}
        delay 0.1
        key code 126
        delay 0.1
        key code 125
        delay 0.1
        key code 125 using {{command down, shift down}}
    end tell

    set startTime to current date
    tell application "System Events"
        keystroke "c" using command down
    end tell
    delay 0.1
    set initialClipboard to the clipboard

    tell application "System Events"
        delay 0.1
        tell application "Notes" to activate
        tell process "Notes"
            click menu bar item "Edit" of menu bar 1

            click menu item "Writing Tools" of menu "Edit" of menu bar item "Edit" of menu bar 1
            delay 0.1

            click menu item "Rewrite" of menu 1 of menu item "Writing Tools" of menu "Edit" of menu bar item "Edit" of menu bar 1
            delay 0.1
        end tell
    end tell

    repeat
        delay 1

        tell application "System Events"
            keystroke "c" using command down
        end tell

        set currentClipboard to the clipboard

        if currentClipboard is not initialClipboard then
            delay 0.5
            -- Removed code that deletes the note
            delay 0.5
            delay 0.2
            activate application a
            delay 0.1
            return currentClipboard
        end if
    end repeat
    """

    process = subprocess.Popen(['osascript', '-e', apple_script_command],
                               stdout=subprocess.PIPE, stderr=subprocess.PIPE)

    stdout, stderr = process.communicate()

    if process.returncode != 0:
        raise Exception(f"Error executing osascript: {stderr.decode('utf-8')}")

    return stdout.decode('utf-8')


def main():
    convo = ""

    while True:
        try:
            user_input = input("Apple Intelligence > ").strip()
            convo += f" [user]: {user_input} [assistant]: "
            response = ask_ai(convo)

            if "«class utf8»:" in response:
                response = response.split("«class utf8»:")[1].strip()

            convo += response
            print(response)

        except Exception as e:
            print(f"Error: {e}")
        except KeyboardInterrupt:
            print("^C")
            break


if __name__ == "__main__":
    main()
