# Backups e criptografia

## Backup diário cifrado
```powershell
docker exec meu-sistema-postgres sh -c 'pg_dump -U $POSTGRES_USER -d $POSTGRES_DB -Fc' > smartstock.dump
# cifrar antes de guardar fora do computador (7-Zip com AES-256 e senha forte):
7z a -tzip -mem=AES256 -p smartstock-AAAA-MM-DD.zip smartstock.dump
Remove-Item smartstock.dump
```

## Regras
- Guarde no mínimo 7 cópias diárias e 4 semanais, **sempre cifradas**. Nunca envie o `.dump` sem cifrar para nuvem, e-mail ou pendrive.
- A senha do backup fica com o responsável técnico, separada do backup.
- Teste a restauração uma vez por mês em uma máquina de teste.
- Backups também entram na retenção: um backup de 1 ano atrás ainda tem dados de clientes já anonimizados. Elimine cópias mais antigas que 90 dias.
- O `.env` (com `AUTH_SECRET` e a senha do banco) **não** vai no backup do banco. Guarde em um cofre de senhas.

## Criptografia
- **Em trânsito:** HTTPS pelo túnel (ngrok ou Cloudflare) ou por proxy com certificado. O cookie de sessão sai com `Secure` automaticamente em HTTPS.
- **Em repouso:** ative a criptografia do disco do servidor (BitLocker no Windows, LUKS no Linux). A cifragem por coluna ainda não foi implementada (ver RIPD, item 4.1).
- **Senhas:** BCrypt (não reversível).
- **Tokens:** assinados com HMAC-SHA256 com o `AUTH_SECRET` (mínimo de 32 caracteres, obrigatório).
