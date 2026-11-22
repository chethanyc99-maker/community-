Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
currentDir = fso.GetParentFolderName(WScript.ScriptFullName)
WshShell.CurrentDirectory = currentDir

' Open web browser after 2 seconds
WshShell.Run "cmd /c timeout /t 2 /nobreak >nul & start http://localhost:5000", 0, False

' Start Flask server
WshShell.Run "python app.py", 1, True
