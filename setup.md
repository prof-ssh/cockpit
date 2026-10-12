# Setup — Preparar uma máquina

O Docker iguala o ambiente **dentro dos containers** (Node, Postgres e bibliotecas nas mesmas
versões). O que muda entre os sistemas é só a instalação do próprio Docker. Depois dela, os
passos são os mesmos em qualquer máquina.

## 1. Instalar o Docker

### Linux (Ubuntu)

Instalação pelo repositório oficial do Docker (Docker Engine + plugin do compose):

```bash
# dependências e chave do repositório
sudo apt-get update
sudo apt-get install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# repositório
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# instalação
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# usar o docker sem sudo (depois, sair e entrar de novo na sessão)
sudo usermod -aG docker $USER
```

### Windows

1. No PowerShell **como administrador**, instale o WSL2 e reinicie o computador:
   ```powershell
   wsl --install
   ```
2. Baixe e instale o **Docker Desktop**: <https://www.docker.com/products/docker-desktop/>.
3. Em **Settings**:
   - **General:** marcar *Use the WSL 2 based engine* e *Start Docker Desktop when you sign in*.
4. Abra o Docker Desktop e espere o status ficar verde (*Engine running*).

## 2. Conferir a instalação

Igual nos dois sistemas (no Windows, pelo PowerShell ou pelo terminal do WSL):

```bash
docker --version
docker compose version
docker run --rm hello-world
```

Se o `hello-world` imprimir *Hello from Docker!*, está tudo certo.

## 3. Configurar o Git

```bash
git config --global user.name "Seu Nome"
git config --global user.email "seu@email.com"
git config --global core.autocrlf input
git config --global init.defaultBranch main
```

O `init.defaultBranch main` faz todo repositório novo nascer com o branch `main`. Versões mais
antigas do Git usam `master` por padrão.

O `core.autocrlf input` (junto com o `.gitattributes` do projeto) mantém as quebras de linha em
LF. No Windows, o padrão CRLF quebra scripts dentro dos containers.

## 4. Configurar o GitHub

### Conta (uma vez só)

1. Criar a conta em <https://github.com/signup>.
2. Ativar a autenticação em dois fatores: **Settings → Password and authentication → Two-factor
   authentication**.

### Chave SSH (uma por finalidade, em cada máquina)

Cada máquina tem a sua própria chave, e cada finalidade (GitHub, um script, outro serviço) também.
Se uma vazar ou uma máquina for perdida, basta apagar aquela chave no GitHub, sem afetar as outras.

**Padrão de nomes:**

- **arquivo:** `~/.ssh/id_ed25519_<finalidade>`, ex.: `id_ed25519_github`;
- **comentário (`-C`):** `<finalidade>-<aparelho>-<sistema>`, ex.: `github-samsung-linux`. É o que aparece no GitHub.

**Importante:** rode os comandos que pedem senha num terminal comum. Pelo `!` do Claude Code, o
prompt de senha não aparece e a chave é salva **sem senha**.

**1. Gerar a chave, com senha (passphrase):**

```bash
ssh-keygen -t ed25519 -C "github-samsung-linux" -f ~/.ssh/id_ed25519_github
```

| Parte | O que faz |
| --- | --- |
| `-t ed25519` | Tipo da chave: o padrão moderno, mais seguro e menor que o RSA. |
| `-C "..."` | Comentário para identificar a chave. O tipo já é gravado na chave sozinho. |
| `-f ...` | Onde salvar. Gera a privada (`id_ed25519_github`) e a pública (`.pub`). |

Se a chave foi gerada sem senha, dá para colocar depois sem trocá-la: `ssh-keygen -p -f ~/.ssh/id_ed25519_github`.

A senha não é gravada em lugar nenhum: ela é usada para criptografar a chave privada.

**2. Criar o `~/.ssh/config`** (permissão `600`):

```
Host github.com
  IdentityFile ~/.ssh/id_ed25519_github
  IdentitiesOnly yes
  AddKeysToAgent yes
```

| Linha | O que faz |
| --- | --- |
| `IdentityFile` | Qual chave usar com o GitHub (o nome não é o padrão). |
| `IdentitiesOnly yes` | Oferece só essa chave, não todas as que existirem. |
| `AddKeysToAgent yes` | Depois de destravada, a chave fica no agente e a senha não é pedida de novo. |

**3. Cadastrar no GitHub:** copiar a saída de `cat ~/.ssh/id_ed25519_github.pub` e colar em
**Settings → SSH and GPG keys → New SSH key** (*Title* = o comentário, *Key type* = Authentication Key).

**4. Testar:**

```bash
ssh -T git@github.com
```

- Na primeira conexão, confirmar o fingerprint oficial do GitHub,
  `SHA256:+DiY3wvvV6TuJJhbpZisF/zLDA0zPMSvHdkr4UvCOqU`, e responder `yes`.
- Deve aparecer `Hi <usuario>! You've successfully authenticated...`.

**5. Não digitar a senha toda hora:**

- **Linux (Ubuntu/GNOME):** o chaveiro do GNOME já é o agente SSH. Na primeira vez que a chave
  for usada, abre uma janela pedindo a senha. Marque **"Desbloquear automaticamente esta chave
  sempre que eu entrar"**, e a senha do login do Ubuntu passa a destravá-la. Nada no `.bashrc`.
- **Windows:** use o agente do próprio Windows, que guarda a chave entre reinicializações. No
  PowerShell como administrador:
  ```powershell
  Get-Service ssh-agent | Set-Service -StartupType Automatic
  Start-Service ssh-agent
  ```
  Depois, num terminal comum:
  ```powershell
  ssh-add $env:USERPROFILE\.ssh\id_ed25519_github
  git config --global core.sshCommand "C:/Windows/System32/OpenSSH/ssh.exe"
  ```
  A última linha faz o Git usar o SSH do Windows (e o agente dele) em vez do que vem com o Git.

A chave **privada** (sem `.pub`) nunca sai da máquina e nunca é compartilhada.

### Repositório

- Criar como **público**. No plano gratuito, a proteção de branch só funciona em repositório público.
- Como o código fica visível, **nenhum segredo entra no Git**: credenciais só no `.env`, que está no
  `.gitignore`. Ativar em **Settings → Code security → Secret scanning → Push protection**: o
  GitHub recusa um push que contenha uma senha ou um token.
- **Só dados fictícios no repositório.** As vendas trazem dados pessoais dos alunos (LGPD):
  nenhum JSON real, dump do banco ou arquivo de teste com dados de verdade.
- **Se um segredo vazar, troque a credencial na hora.** Apagar o arquivo não basta, porque ele
  continua no histórico do Git.
- **E-mail dos commits:** usar o e-mail anônimo do GitHub (`<id>+<usuario>@users.noreply.github.com`,
  em **Settings → Emails**) e marcar **"Block command line pushes that expose my email"**.
- Se um dia o projeto precisar ficar privado, dá para mudar em **Settings → Danger Zone**.
- Usar sempre a URL SSH (`git@github.com:<usuario>/cockpit.git`), não a HTTPS.
- Se a outra máquina for de outra pessoa, ela usa a própria conta e é adicionada em
  **Settings → Collaborators** do repositório.

### Proteger a `main`

Configurar **depois do primeiro push**, senão o próprio commit inicial é bloqueado.

**Settings → Rules → Rulesets → New ruleset → New branch ruleset:**

| Campo | Valor |
| --- | --- |
| Ruleset name | `proteger-main` |
| Enforcement status | **Active** |
| Bypass list | vazia (nem o dono pula as regras) |
| Target branches | **Add target → Include default branch** |
| Restrict deletions | ✅ |
| Block force pushes | ✅ |
| Require a pull request before merging | ✅, com **Required approvals = 0** |

As aprovações ficam em 0 porque o GitHub não deixa o autor aprovar o próprio PR. O "aceitar" é
clicar em **Merge** no PR.

## 5. Subir o projeto

```bash
git clone git@github.com:<usuario>/cockpit.git
cd cockpit
cp .env.example .env    # e preencher os valores
docker compose up
```
