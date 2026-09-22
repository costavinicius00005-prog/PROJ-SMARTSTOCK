# SmartStock Entregas

Aplicativo Flutter local-first para operação de rotas e entregas do SmartStock.

## Executar

```bash
flutter pub get
flutter run
```

Use qualquer e-mail e senha preenchidos para acessar o modo demonstração local.

## Conectar ao backend Spring Boot

O padrão continua sendo local. Para conectar ao backend existente, execute em um
emulador Android:

```bash
flutter run --dart-define=USE_API=true --dart-define=API_BASE_URL=http://10.0.2.2:8081/api
```

Em um celular físico, substitua `10.0.2.2` pelo IP da máquina que está executando
o Spring Boot, por exemplo `http://192.168.0.10:8081/api`.

## Entregue

- Login, rota diária, filtros e busca;
- Detalhe de pedido, Maps, ligação e WhatsApp;
- Início de rota, confirmação, ocorrência e foto de comprovante;
- SQLite com persistência local e eventos pendentes de sincronização;
- Contrato `DeliveryRepository` pronto para um adaptador REST/Spring Boot.

Os documentos de uso e arquitetura estão em `docs/`.
## APK Android ligado ao ERP local

Para usar o APK em um celular físico com o banco no PC:

1. Conecte celular e computador na mesma rede Wi-Fi/LAN.
2. Inicie o backend Spring Boot na porta `8081`.
3. No PowerShell **como Administrador**, libere a API uma única vez:

   ```powershell
   New-NetFirewallRule -DisplayName "SmartStock API Local (TCP 8081)" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 8081 -Profile Private
   ```

4. Gere o APK com o IP atual do computador (exemplo deste ambiente):

   ```bash
   flutter build apk --release --dart-define=USE_API=true --dart-define=API_BASE_URL=http://192.168.2.7:8081/api
   ```

`10.0.2.2` funciona apenas no emulador Android. Em aparelho físico, use o IPv4
da rede local do PC. Se o roteador trocar esse IP, gere outro APK com o novo
endereço ou configure uma reserva de IP no roteador.

## Demonstração remota temporária

Para testar fora da rede local, utilize um túnel HTTPS temporário. Mantenha o
backend e o processo do túnel ativos durante todo o teste. O endereço gerado
não é permanente e um APK deve ser reconstruído caso o túnel seja reiniciado.

```bash
cloudflared tunnel --url http://localhost:8081 --no-autoupdate
flutter build apk --release --dart-define=USE_API=true --dart-define=API_BASE_URL=https://SEU-ENDERECO.trycloudflare.com/api
```

Túneis rápidos são apropriados somente para demonstração: não publique dados
reais nem deixe o link ativo após finalizar os testes.
