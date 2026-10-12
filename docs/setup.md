# Setup — Preparar uma máquina

O Docker iguala o ambiente **dentro dos containers** (Node, Postgres e bibliotecas nas mesmas
versões). O que muda entre os sistemas é só a instalação do próprio Docker. Depois dela, os
passos são os mesmos em qualquer máquina.

## 1. Instalar o Docker

### Linux (Ubuntu)

Instalação pelo repositório oficial do Docker (Docker Engine + plugin do compose). Rode num
terminal comum: o `sudo` pede a senha.

#### Por que adicionar um repositório

O `apt` (instalador do Ubuntu) só instala programas das fontes que conhece, os **repositórios**.
O Ubuntu tem um pacote do Docker, mas antigo e sem o `docker compose`; por isso o `apt` passa a
buscar também no repositório oficial do Docker.

Para confiar nesse repositório, o `apt` usa uma **chave**: cada pacote do Docker vem assinado, e o
`apt` confere a assinatura com a chave guardada em `/etc/apt/keyrings/`. Pacote adulterado ou
chave vencida → o `apt` recusa (é o aviso `EXPKEYSIG` que aparece quando uma chave expira).

A chave vale **só para a máquina** onde foi baixada: não faz parte do projeto nem vai para o Git.
Cada máquina instala o Docker uma vez, por conta própria. Depois de instalado, o Docker não usa
mais essa pasta; ela só serve ao `apt`.

```
1. pasta das chaves → 2. chave do Docker → 3. repositório (aponta para a chave) → 4. instalar
```

#### 1. Dependências

```bash
sudo apt-get update                           # atualiza a lista de programas conhecidos
sudo apt-get install -y ca-certificates curl  # certificados HTTPS e o curl (baixa arquivos)
```

O `-y` responde "sim" sozinho ao "deseja continuar?".

#### 2. Chave do repositório

```bash
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
ls -l /etc/apt/keyrings/                      # conferir: deve aparecer o docker.asc
```

| Parte | O que faz |
| --- | --- |
| `install -d` | Cria a pasta. |
| `-m 0755` | Só o administrador altera; todos leem (o `apt` precisa ler). |
| `curl -fsSL` | Baixa: falha se der erro (`f`), silencioso (`sS`), segue redirecionamentos (`L`). |
| `-o .../docker.asc` | Onde salvar a chave. |
| `chmod a+r` | Garante que todos possam ler a chave. |

#### 3. Repositório

```bash
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
cat /etc/apt/sources.list.d/docker.list       # conferir a linha gravada
```

| Parte | O que é |
| --- | --- |
| `deb` | Repositório de pacotes `.deb` (formato do Ubuntu). |
| `arch=$(dpkg --print-architecture)` | Arquitetura do processador (ex.: `amd64`), descoberta na hora. |
| `signed-by=...docker.asc` | Só aceita pacotes assinados por essa chave. |
| `https://download.docker.com/linux/ubuntu` | Endereço do repositório. |
| `$(. /etc/os-release && echo "$VERSION_CODENAME")` | Apelido da versão do Ubuntu (ex.: `jammy` = 22.04). |
| `stable` | Só versões estáveis. |
| `\| sudo tee ...docker.list` | Grava a linha no arquivo (`/etc` exige `sudo`). |
| `> /dev/null` | Esconde a saída repetida na tela. |

#### 4. Instalação

```bash
sudo apt-get update   # deve aparecer uma linha com download.docker.com
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

| Pacote | O que é |
| --- | --- |
| `docker-ce` | O motor do Docker, que roda os containers em segundo plano. |
| `docker-ce-cli` | O comando `docker` do terminal. |
| `containerd.io` | A peça de baixo nível que liga e desliga os containers. |
| `docker-buildx-plugin` | Monta imagens a partir de um `Dockerfile`. |
| `docker-compose-plugin` | O `docker compose`, que sobe vários containers juntos. |

#### 5. Usar o Docker sem `sudo`

```bash
sudo usermod -aG docker $USER
```

Coloca o seu usuário no grupo `docker`. Só vale depois de **sair e entrar de novo na sessão**
(ou reiniciar).

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
cp .env.example .env    # e preencher os valores (inclusive EVO_USERNAME e EVO_PASSWORD)
docker compose up --build
```

O compose sobe três serviços, nesta ordem:

| Serviço | O que faz |
| --- | --- |
| `db` | O Postgres. |
| `migrate` | Aplica as migrations pendentes (`prisma migrate deploy`) e termina. |
| `app` | O cockpit em <http://localhost:3000>. Só sobe se o `migrate` terminar bem. |

Conferir: <http://localhost:3000/api/health> deve responder `{"status":"ok","banco":"ok"}`.

Para desenvolver sem rebuildar a imagem a cada mudança: `docker compose up -d db`, depois
`npx prisma migrate deploy` e `npm run dev` (o app em <http://localhost:3000>, recarregando sozinho).
