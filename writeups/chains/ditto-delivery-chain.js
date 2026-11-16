const CHAIN = {
  title: "Ditto DLL Side-Loading and Domain Compromise",
  subtitle: "A vishing call and a Quick Assist session led to a side-loaded RAT and a domain compromise 30 minutes after first access.",
  meta: [
    { k: "Source", v: "Sanitized IR case" },
    { k: "Implant", v: "Botan RAT" },
    { k: "Published", v: "2026-10-02" },
    { k: "To KRBTGT", v: "About 30 min" },
    { k: "Open", v: "What the relay targeted" }
  ],
  phases: [
    { id: "ia", name: "Initial Access",    ta: "TA0001" },
    { id: "ex", name: "Execution",         ta: "TA0002" },
    { id: "de", name: "Defense Evasion",   ta: "TA0005" },
    { id: "c2", name: "Command & Control", ta: "TA0011" },
    { id: "ca", name: "Credential Access", ta: "TA0006" },
    { id: "lm", name: "Lateral Movement",  ta: "TA0008" }
  ],
  nodes: [
    { id: "vish", phase: "ia", type: "confirmed", icon: "phone",
      label: "Vishing, Quick Assist", sub: "User accepts a remote session; operator has the keyboard",
      technique: "T1566.004",
      desc: "The operator called the user and talked them into accepting a Quick Assist session. Two minutes of whoami, ipconfig and net user /domain later, they pulled an MSI from a staging IP.",
      iocs: ["45.61.163[.]226"] },

    { id: "stage1", phase: "ex", type: "detected", icon: "shield-halved",
      label: "Stage 1 MSI blocked", sub: "userenv.dll side-load under pdf24.exe stopped",
      technique: "T1204.002",
      desc: "The first MSI tried to side-load a malicious userenv.dll under pdf24.exe, and Defender blocked it as Potential Side-Loaded Behavior Was Blocked. The strings were enough to identify the family anyway: a Botan 3 AES-GCM RAT built with MinGW, with the C2 base64-encoded inside.",
      notes: "The block cost the operator about ninety seconds. A second MSI followed three minutes later." },

    { id: "sideload", phase: "de", type: "confirmed", icon: "clipboard",
      label: "Ditto side-load", sub: "Fake vcruntime140.dll beside Ditto.exe",
      technique: "T1574.001",
      desc: "The second MSI installed a copy of Ditto, an open-source clipboard manager, with a fake vcruntime140.dll next to it and a Startup shortcut for persistence. Ditto loads the local DLL ahead of the System32 copy, so the implant runs inside a legitimate process.",
      iocs: ["849a2c808694426b2afb8848dcea00f9e64538a503b05543e38af1fdee9dd9f8",
             "9d20d9f17dddedd3ea057b68e42ef2ca86ff7c776d59b045213f377ba1707291",
             "%LOCALAPPDATA%\\Ditto\\",
             "%APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs\\Startup\\Ditto.lnk"],
      notes: "Both payloads are the same family: same Botan strings, same base64 C2 and the same implant GUID." },

    { id: "c2", phase: "c2", type: "confirmed", icon: "tower-broadcast",
      label: "C2 over UDP/53", sub: "Not a resolver, and the packets aren't valid DNS",
      technique: "T1095",
      desc: "The implant beacons to an external IP on UDP/53. It isn't a real resolver and the packets aren't valid DNS, so it's DNS-as-transport with an AES-256-GCM beacon inside.",
      iocs: ["45.55.94[.]174", "NDUuNTUuOTQuMTc0"],
      notes: "High for the transport. Medium for the AES-GCM wrapping: it comes from the Botan strings and the beacon template; I didn't decrypt traffic." },

    { id: "petit", phase: "ca", type: "confirmed", icon: "bullseye",
      label: "PetitPotam coercion", sub: "EFSRPC pipe activity against a domain controller",
      technique: "T1187",
      desc: "About nine minutes after the second MSI, PetitPotam coercion hit a domain controller over \\PIPE\\efsrpc. I found it hunting for PetitPotam in Advanced Hunting.",
      iocs: ["\\PIPE\\efsrpc"] },

    { id: "relay", phase: "ca", type: "suspected", icon: "shuffle",
      label: "NTLM relay", sub: "DC connects out to a VPS right after the coercion",
      technique: "",
      desc: "The DC then made an outbound connection to a DigitalOcean-hosted VPS. That's consistent with a coerced authentication being relayed.",
      iocs: ["167.172.212[.]171"],
      notes: "Inferred from that outbound connection. What the relay targeted (AD CS enrollment, LDAP, something else) isn't confirmed, and neither is how it turned into replication rights." },

    { id: "dcsync", phase: "ca", type: "impact", icon: "key",
      label: "DCSync, KRBTGT exposed", sub: "Workstation requests replication from the DC",
      technique: "T1003.006",
      desc: "About eleven minutes later the workstation ran DCSync against that DC: DRSGetNCChanges from a machine that doesn't replicate directory data. KRBTGT was treated as exposed, and a forged ticket stays valid until it's reset twice.",
      notes: "High. I'm treating KRBTGT as compromised because the replication request covers it." },

    { id: "rdp", phase: "lm", type: "impact", icon: "network-wired",
      label: "RDP to two servers", sub: "GetScreen and DWAgent dropped on each",
      technique: "T1021.001",
      desc: "An over-privileged service account made the rest trivial. The operator used it to RDP to two more servers and dropped GetScreen.me and DWAgent on each. Three footholds by the 48-minute mark, and no ransomware, so access looks like the goal." }
  ],
  edges: [
    ["vish", "stage1", "detected"],
    ["stage1", "sideload", "confirmed"],
    ["sideload", "c2"],
    ["c2", "petit"],
    ["petit", "relay", "suspected"],
    ["relay", "dcsync", "suspected"],
    ["dcsync", "rdp"]
  ]
};
