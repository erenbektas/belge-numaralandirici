[Setup]
AppId={{B7E3F2A1-4D5C-6E7F-8A9B-0C1D2E3F4A5B}
AppName=Numaralandırıcı
AppVersion=2.5.0
AppVerName=Numaralandırıcı 2.5.0
AppPublisher=Y. Eren Bektaş
DefaultDirName={autopf}\Numaralandirici
DefaultGroupName=Numaralandırıcı
UninstallDisplayIcon={app}\Numaralandirici.exe
OutputDir=installer-output
OutputBaseFilename=Numaralandirici-v2.5.0-Setup
Compression=lzma2/ultra64
SolidCompression=yes
SetupIconFile=src\Numaralandirici\icon.ico
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
WizardStyle=modern
PrivilegesRequired=admin

[Languages]
Name: "turkish"; MessagesFile: "compiler:Languages\Turkish.isl"

[Tasks]
Name: "desktopicon"; Description: "Masaüstü kısayolu oluştur"; GroupDescription: "Ek simgeler:"

[Files]
Source: "src\Numaralandirici\bin\Release\net8.0-windows\win-x64\publish\Numaralandirici.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "src\Numaralandirici\bin\Release\net8.0-windows\win-x64\publish\tools\gs\*"; DestDir: "{app}\tools\gs"; Flags: ignoreversion recursesubdirs
Source: "src\Numaralandirici\bin\Release\net8.0-windows\win-x64\publish\tools\qpdf\*"; DestDir: "{app}\tools\qpdf"; Flags: ignoreversion recursesubdirs

[Icons]
Name: "{group}\Numaralandırıcı"; Filename: "{app}\Numaralandirici.exe"
Name: "{group}\Numaralandırıcı'yı Kaldır"; Filename: "{uninstallexe}"
Name: "{autodesktop}\Numaralandırıcı"; Filename: "{app}\Numaralandirici.exe"; Tasks: desktopicon

[Run]
Filename: "{app}\Numaralandirici.exe"; Description: "Numaralandırıcı'yı başlat"; Flags: nowait postinstall skipifsilent
