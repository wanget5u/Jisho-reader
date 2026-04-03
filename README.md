# Jisho Reader and Anki Deck Builder

An app that monitors your clipboard for text, parses it, allows for quick Jisho dictionary lookups, and automatically builds Anki flashcards.

## Prerequisites
* [Python 3](https://www.python.org/downloads/)
* [Anki](https://apps.ankiweb.net/)
* [AnkiConnect](https://ankiweb.net/shared/info/2055492159) add-on (Install code: **2055492159**)

## Initial Setup
1. Open Anki and navigate to **Tools** > **Add-ons** > **AnkiConnect** > **Config**.
2. Update the `webCorsOriginList` to include the following values:
   ```json
   "webCorsOriginList": [
       "*",
       "null",
       "http://localhost",
       "[http://127.0.0.1](http://127.0.0.1)"
   ]
3. Restart Anki to apply the configuration changes.
4. Open cmd in the root folder and run the following command to install the required Python dependencies:
    ```
    pip install -r requirements.txt
    ```
    
## Anki Note Type Setup

You will need to configure your Anki card template to match the fields sent by the app.

Front Template:
```
{{Sentence}}
```

Back Template:
```
<span class="japanese-text">{{FrontSide}}</span>
   
<hr id=answer>
{{Audio}}

{{#Target word 1}}
   <br>
   <span class="japanese-text">{{Target word 1}} ({{Reading 1}})</span> ー {{Definitions 1}}
{{/Target word 1}}
   
{{#Target word 2}}
   <br><br>
   <span class="japanese-text">{{Target word 2}} ({{Reading 2}})</span> ー {{Definitions 2}}
{{/Target word 2}}
  
{{#Target word 3}}
   <br><br>
   <span class="japanese-text">{{Target word 3}} ({{Reading 3}})</span> ー {{Definitions 3}}
{{/Target word 3}}
  
{{#Target word 4}}
   <br><br>
   <span class="japanese-text">{{Target word 4}} ({{Reading 4}})</span> ー {{Definitions 4}}
{{/Target word 4}}
  
{{#Target word 5}}
   <br><br>
   <span class="japanese-text">{{Target word 5}} ({{Reading 5}})</span> ー {{Definitions 5}}
{{/Target word 5}}
   
{{Screenshot}}
```
  
## Running the App
- Ensure Anki is open and running.
- Run the .bat file.

## Shutdown and Troubleshooting
- To safely shut down the background Python server, simply close the browser tab.
- If the server becomes stuck or you need to manually force close the background process, open the cmd and run:
```
taskkill /f /im pythonw.exe
```
