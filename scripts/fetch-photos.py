"""Download candidate Unsplash IDs for visual QA. Re-runnable. Usage: python scripts/fetch-photos.py"""
import os
import urllib.request

IDS = """
photo-1476234251651-f353703a034d
photo-1519238263530-99bdd11df2ea
photo-1530103862676-de8c9debad1d
photo-1509062522246-3755977927d7
photo-1588072432836-e10032774350
photo-1542810634-71277d95dcbb
photo-1555009393-f20bdb245c4d
photo-1514090458221-65bb69cf63e6
photo-1503919545889-aef636e10ad4
photo-1540479859555-17af45c78602
photo-1596870230751-ebdfce98ec42
photo-1607453998774-d533f65dac99
photo-1516826957135-700dedea698c
photo-1548126032-079a0fb0099d
photo-1488161628813-04466f872be2
photo-1521341957697-b93449760f30
photo-1506629082955-511b1aa562c8
photo-1604467794349-0b74285de7e7
photo-1526634332515-d56c5fd16991
photo-1520006403909-838d6b92c22e
photo-1591195853828-11db59a44f6b
photo-1517963879433-6ad2b056d712
""".split()

D = "E:/tmp/opencode/verify2"
os.makedirs(D, exist_ok=True)
ok, bad = [], []
for i in IDS:
    try:
        urllib.request.urlretrieve(
            "https://images.unsplash.com/" + i + "?w=400",
            D + "/" + i.replace("photo-", "") + ".jpg",
        )
        ok.append(i)
    except Exception:
        bad.append(i)
open(D + "/ids.txt", "w").write("\n".join(ok))
print("OK=", len(ok), "BAD=", bad)
