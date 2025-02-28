(for /d %%i in (*) do @attrib "%%i" | find /i "H" >nul || dir /s "%%i") > list.txt
