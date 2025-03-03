(for /d %%i in (*) do (
    if not exist "%%i\*" (echo Skipping %%i) else dir /s "%%i"
)) > list.txt
