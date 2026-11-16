const CHAIN = {
  title: "ClickFix to CLR RAT Delivery Chain",
  subtitle: "A ClickFix PowerShell paste leads to shellcode, a native injector, and an in-memory .NET implant hiding in a Bluetooth svchost.",
  meta: [
    { k: "Source", v: "Sanitized case and sandbox run" },
    { k: "Implant", v: "CLR assembly sub00" },
    { k: "Published", v: "2026-10-02" },
    { k: "Open", v: "Whether the 28 MB was exfil" }
  ],
  phases: [
    { id: "ex",  name: "Execution",         ta: "TA0002" },
    { id: "de",  name: "Defense Evasion",   ta: "TA0005" },
    { id: "col", name: "Collection",        ta: "TA0009" },
    { id: "c2",  name: "Command & Control", ta: "TA0011" }
  ],
  nodes: [
    { id: "paste", phase: "ex", type: "confirmed", icon: "paste",
      label: "ClickFix paste", sub: "Win+R PowerShell one-liner around iex(irm ...)",
      technique: "T1204.004",
      desc: "The lure had the user press Win+R and paste a PowerShell one-liner that fetches and runs a script from a bare IP.",
      iocs: ["hxxp://158.94.211[.]77/?sid=<random>"] },

    { id: "runner", phase: "ex", type: "confirmed", icon: "terminal",
      label: "Shellcode runner", sub: "Downloads s_enterprise and runs it from memory",
      technique: "T1059.001",
      desc: "What comes back is a stock shellcode runner: download s_enterprise from a second IP, allocate executable memory, run it.",
      iocs: ["hxxp://158.94.211[.]76/s_enterprise"] },

    { id: "loader", phase: "de", type: "confirmed", icon: "microchip",
      label: "Donut-class loader", sub: "No PE header; unpacks a native injector",
      technique: "T1620",
      desc: "s_enterprise has no PE header and looks like noise to file and FLOSS, so I disassembled the raw x64 in Ghidra: a PEB walk, export parsing with name hashing, and a context structure used to copy a payload into a buffer. The payload is mod_s_enterprise, a MinGW-built injector.",
      iocs: ["4d9c5a3c56f5747ed6ae519c11e99bb56edfccb324ddf63f7ce8a7ada340485a"],
      notes: "Medium: the behavior matches Donut, but I never recovered a config, so I can't name the builder." },

    { id: "inject", phase: "de", type: "confirmed", icon: "syringe",
      label: "Injection into svchost", sub: "Remote thread in the Bluetooth user service",
      technique: "T1055",
      desc: "The injector downloads student_s.bin and targets svchost.exe. Defender logged an unbacked CLR module load, then a CreateRemoteThreadApiCall into svchost.exe -k BthAppGroup -p -s BluetoothUserService. Nothing the implant did afterward was Bluetooth-specific, so the service looks like a convenient hiding spot.",
      iocs: ["hxxp://158.94.211[.]76/enterprise/student_s.bin",
             "53d83e993c624528043881ff9758ef606d77487e682230714c510b272d68b7db",
             "svchost.exe -k BthAppGroup -p -s BluetoothUserService"] },

    { id: "clr", phase: "de", type: "confirmed", icon: "ghost",
      label: "In-memory .NET implant", sub: "CLR assembly sub00 loads inside that svchost",
      technique: "T1620",
      desc: "A second CLR assembly, sub00, loads inside the injected svchost, with more unbacked CLR loads after it and no disk writes. sub00 is the one notable string in student_s.bin, which is a plain native PE.",
      iocs: ["sub00", "jq5ksud0"],
      notes: "High for the link. Open: how the binary hosts the CLR, which I never confirmed from the imports I captured." },

    { id: "collect", phase: "col", type: "impact", icon: "camera",
      label: "Screenshots, Edge creds", sub: "Logged by Defender after the implant loads",
      technique: "T1113",
      desc: "After sub00 loads, Defender logged ScreenshotTaken, Edge DPAPI credential access, and more in-memory .NET loads." },

    { id: "c2", phase: "c2", type: "suspected", icon: "tower-broadcast",
      label: "C2, possible exfil", sub: "28 MB outbound in a sandbox run, not on the host",
      technique: "",
      desc: "Sandbox detonation of student_s.bin reached this address with about 28 MB outbound, tagged RAT / C2.",
      iocs: ["91.92.243[.]161:3038"],
      notes: "Medium. The address comes from the sandbox run, not from the victim host. Network telemetry from the host showing direction and content would confirm exfil." }
  ],
  edges: [
    ["paste", "runner"],
    ["runner", "loader"],
    ["loader", "inject"],
    ["inject", "clr"],
    ["clr", "collect"],
    ["collect", "c2", "suspected"]
  ]
};
