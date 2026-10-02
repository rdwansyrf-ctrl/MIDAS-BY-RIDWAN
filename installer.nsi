; RDWN M32 Live Training Simulator NSIS Installer Script
; Produces: RDWN_M32_Live_Training_Simulator_Setup.exe

!define PRODUCT_NAME "RDWN M32 Live Training Simulator"
!define PRODUCT_VERSION "1.0.0"
!define PRODUCT_PUBLISHER "RDWN Audio Systems"
!define PRODUCT_WEB_SITE "https://github.com/rdwn/m32-simulator"
!define PRODUCT_DIR_REGKEY "Software\Microsoft\Windows\CurrentVersion\App Paths\RDWN_M32_Live_Training_Simulator.exe"
!define PRODUCT_UNINST_KEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}"
!define PRODUCT_UNINST_ROOT_KEY "HKCU"

SetCompressor /SOLID lzma
Name "${PRODUCT_NAME} ${PRODUCT_VERSION}"
OutFile "Release\RDWN_M32_Live_Training_Simulator_Setup.exe"
InstallDir "$LOCALAPPDATA\Programs\RDWN\M32 Live Training Simulator"
InstallDirRegKey HKCU "${PRODUCT_DIR_REGKEY}" ""
ShowInstDetails show
ShowUnInstDetails show

Section "MainSection" SEC01
  SetOutPath "$INSTDIR"
  SetOverwrite ifnewer
  
  ; Application binaries & web assets
  File /r "dist\*.*"
  File /nonfatal "src-tauri\target\release\rdwn-m32-simulator.exe"
  
  ; Create Desktop Shortcut
  CreateShortCut "$DESKTOP\RDWN M32 Live Training Simulator.lnk" "$INSTDIR\rdwn-m32-simulator.exe" "" "$INSTDIR\rdwn-m32-simulator.exe" 0
  
  ; Create Start Menu Shortcuts
  CreateDirectory "$SMPROGRAMS\RDWN"
  CreateShortCut "$SMPROGRAMS\RDWN\RDWN M32 Live Training Simulator.lnk" "$INSTDIR\rdwn-m32-simulator.exe" "" "$INSTDIR\rdwn-m32-simulator.exe" 0
  CreateShortCut "$SMPROGRAMS\RDWN\Uninstall RDWN M32 Simulator.lnk" "$INSTDIR\uninst.exe" "" "$INSTDIR\uninst.exe" 0
SectionEnd

Section -Post
  WriteUninstaller "$INSTDIR\uninst.exe"
  WriteRegStr HKCU "${PRODUCT_DIR_REGKEY}" "" "$INSTDIR\rdwn-m32-simulator.exe"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "DisplayName" "$(^Name)"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "UninstallString" "$INSTDIR\uninst.exe"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "DisplayIcon" "$INSTDIR\rdwn-m32-simulator.exe"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "DisplayVersion" "${PRODUCT_VERSION}"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "URLInfoAbout" "${PRODUCT_WEB_SITE}"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "Publisher" "${PRODUCT_PUBLISHER}"
SectionEnd

Function un.onUninstSuccess
  HideWindow
  MessageBox MB_ICONINFORMATION|MB_OK "$(^Name) was successfully removed from your computer."
FunctionEnd

Function un.onInit
  MessageBox MB_ICONQUESTION|MB_YESNO|MB_DEFBUTTON2 "Are you sure you want to completely remove $(^Name) and all of its components?" IDYES +2
  Abort
FunctionEnd

Section Uninstall
  Delete "$DESKTOP\RDWN M32 Live Training Simulator.lnk"
  Delete "$SMPROGRAMS\RDWN\RDWN M32 Live Training Simulator.lnk"
  Delete "$SMPROGRAMS\RDWN\Uninstall RDWN M32 Simulator.lnk"
  RMDir "$SMPROGRAMS\RDWN"

  RMDir /r "$INSTDIR"
  DeleteRegKey ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}"
  DeleteRegKey HKCU "${PRODUCT_DIR_REGKEY}"
  SetAutoClose true
SectionEnd
