# Dependências de backend pendentes

O build deste repositório é exclusivamente estático. Os endpoints abaixo são
referenciados pelo código recuperado, mas não existem no repositório e não são
criados pelo processo de build.

## Pagamento

| Endpoint | Método | Funcionalidade dependente |
| --- | --- | --- |
| `/pagamento/pagamento-pix/getPayment.php` | `POST` | criação de uma transação |
| `/pagamento/pagamento-pix/verifyPayment.php` | `GET` | consulta do estado da transação |
| `/pagamento/pagamento-pix/utmify-pendente.php` | `POST` | rastreamento de transação pendente |
| `/pagamento/pagamento-pix/utmify.php` | `POST` | rastreamento de confirmação |

Sem esses serviços, a página estática deve apresentar seu tratamento de erro e
não consegue criar ou confirmar transações.

## Cadastro

`cadastro/index.html` contém uma integração opcional com
`cadastro/pixel_data.php`. Ela só é acionada quando as bibliotecas externas
esperadas estão disponíveis.

O arquivo legado `cadastro/cadastro-form.js` não é carregado por nenhuma página,
mas ainda documenta referências antigas a:

- `cadastro/buscarCpf.php`;
- `cadastro/buscarCep.php`;
- `cadastro/termos.php`.

Esses endpoints não participam do formulário local de demonstração atualmente
carregado.

## Rotas sem página recuperada

- `/endereco`;
- `/final`;
- `/acesso-informacao`.

Essas rotas permanecem registradas pela auditoria como pendências conhecidas.
Elas não devem ser redirecionadas para páginas arbitrárias sem recuperar o
conteúdo original ou definir formalmente um novo destino.
