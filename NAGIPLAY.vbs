' Lanzador silencioso de NAGIPLAY (sin ventana de consola).
Set sh = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
base = fso.GetParentFolderName(WScript.ScriptFullName)
electron = base & "\node_modules\electron\dist\NAGIPLAY.exe"
' Pasamos como argumento cualquier archivo con el que se haya abierto (Abrir con...).
extra = ""
If WScript.Arguments.Count > 0 Then
  extra = " """ & WScript.Arguments(0) & """"
End If
sh.CurrentDirectory = base
sh.Run """" & electron & """ """ & base & """" & extra, 0, False
