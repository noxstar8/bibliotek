# Koble GitHub MCP til Claude Code

## 1. Lag et token

[github.com/settings/tokens](https://github.com/settings/tokens) → **Fine-grained
tokens** → **Generate new token**. Velg repo og tilganger (Contents, Issues, Pull
requests). Kopier verdien — den vises én gang.

## 2. Legg det i `.env`

```
GITHUB_PAT=github_pat_tokenet_ditt_her
```

Sjekk at filen er ignorert: `git check-ignore .env` skal svare `.env`.

## 3. Last inn tokenet

Én kommando om gangen — trykk Enter mellom hver.

**Mac:**

```bash
export GITHUB_PAT="$(grep '^GITHUB_PAT=' .env | cut -d '=' -f2-)"
```

```bash
echo ${#GITHUB_PAT}
```

**Windows:**

```powershell
$githubPatLine = Get-Content .env | Select-String "^\s*GITHUB_PAT\s*=" | Select-Object -First 1
```

```powershell
$env:GITHUB_PAT = ($githubPatLine.Line -split "=", 2)[1].Trim().Trim('"').Trim("'")
```

```powershell
$env:GITHUB_PAT.Length
```

Siste kommando skal skrive rundt 93. Skriver den `0`, stopp — resten vil feile.

> PowerShell limer flere linjer inn som én. Limer du hele blokken samlet, blir
> det feil — derfor én om gangen.

## 4. Registrer serveren

Samme vindu som steg 3.

**Mac:**

```bash
claude mcp add --transport http github https://api.githubcopilot.com/mcp -H "Authorization: Bearer $GITHUB_PAT"
```

**Windows:**

```powershell
claude mcp add --transport http github https://api.githubcopilot.com/mcp -H "Authorization: Bearer $env:GITHUB_PAT"
```

## 5. Sjekk og start på nytt

```
claude mcp list
```

Skal vise `github: … ✔ Connected`. Start så Claude Code på nytt.

---

## Hvis det feiler

| Feil                                      | Årsak                                                    |
| ----------------------------------------- | -------------------------------------------------------- |
| `Authorization header is badly formatted` | Variabelen var tom. Kjør steg 3 og 4 i samme vindu.      |
| `Length` skriver `0`                      | Linja i `.env` matcher ikke, eller du står i feil mappe. |
| `HTTP 401`                                | Tokenet er utløpt eller mangler tilgang. Lag et nytt.    |
| `Invalid configuration: : Invalid input`  | Du brukte `claude mcp add-json`. Bruk `claude mcp add`.  |

Fjerne serveren: `claude mcp remove github`. Er tokenet på avveie, må det
tilbakekalles på [github.com/settings/tokens](https://github.com/settings/tokens)
— å fjerne serveren er ikke nok.
