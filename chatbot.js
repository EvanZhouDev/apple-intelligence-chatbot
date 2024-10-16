import { exec } from "child_process";
import express from "express";
import bodyParser from "body-parser";
import { v4 as uuidv4 } from "uuid";  // For generating unique IDs
import fs from "fs";
import path from "path";

const app = express();
app.use(bodyParser.json());

const conversationsFilePath = path.join(__dirname, "conversations.json");

// Helper function to load existing conversations from the file
const loadConversations = () => {
    if (!fs.existsSync(conversationsFilePath)) {
        fs.writeFileSync(conversationsFilePath, JSON.stringify({}));
    }
    const data = fs.readFileSync(conversationsFilePath, "utf-8");
    return JSON.parse(data);
};

// Helper function to save conversations to the file
const saveConversations = (conversations) => {
    fs.writeFileSync(conversationsFilePath, JSON.stringify(conversations, null, 2));
};

const askAI = async (input) => {
    const formattedInput = `system A conversation between a user and a helpful understanding assistant. Always answer the user queries and questions. Continue this conversation. ${input}`;

    const appleScriptCommand = `
    set a to path to frontmost application as text
    
    tell application "Notes"
        delay 0.2
        tell account "iCloud"
            set newNote to make new note ¬
            at folder "Apple Intelligence" ¬
            with properties {name:"Apple Intelligence Chatbot", body:"${formattedInput}"}

            delay 0.2
            show newNote
            delay 0.2
        end tell
    end tell
    
    tell application "System Events"
        key code 124
        delay 0.1
        keystroke "a" using {command down}
        delay 0.1
        key code 126
        delay 0.1
        key code 125
        delay 0.1
        key code 125 using {command down, shift down}
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
            tell application "Notes"
                delete newNote
            end tell
            delay 0.5
            activate application a
            delay 0.1
            return currentClipboard
        end if
    end repeat
    `;

    return new Promise((resolve, reject) => {
        exec(`osascript -e '${appleScriptCommand}'`, (error, stdout, stderr) => {
            if (error) {
                reject(`Error executing osascript: ${error.message}`);
                return;
            }
            if (stderr) {
                reject(`stderr: ${stderr}`);
                return;
            }

            resolve(stdout);
        });
    });
};

app.post("/ask", async (req, res) => {
    try {
        const { input, id } = req.body;

        // Load the current conversations from the JSON file
        const conversations = loadConversations();

        // Generate UID if not provided
        const userId = id || uuidv4();

        // Fetch the current conversation for this user, or start a new one
        let convo = conversations[userId]?.conversation || "";
        convo += `[user (${userId})]: ${input} [assistant]: `;

        // Get AI response
        let response = await askAI(convo);

        // Cleanup response if needed
        if (response.includes("«class utf8»:")) {
            const utf8Index = response.indexOf("«class utf8»:");
            if (utf8Index !== -1) {
                response = response.substring(utf8Index + "«class utf8»:".length).trim();
            }
        }

        convo += `${response}`;

        // Save the updated conversation
        conversations[userId] = {
            conversation: convo,
            timestamp: new Date().toISOString()
        };
        saveConversations(conversations);

        // Return the response and UID
        res.json({ id: userId, response });
    } catch (error) {
        console.error(`Error: ${error}`);
        res.status(500).json({ error: `Error: ${error.message}` });
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});