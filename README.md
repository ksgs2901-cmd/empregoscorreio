# empregoscorreio

Projeto recuperado como aplicação web estática.

## Build

Requer Node.js 18 ou superior e não possui dependências externas:

```bash
npm run check
npm run build
npm run check:dist
```

O artefato de produção é criado em `dist/`. O build:

- copia somente arquivos necessários em runtime;
- remove metadados, arquivos internos e o arquivo-fonte compactado;
- normaliza as fontes Rawline disponíveis para o formato presente no espelho;
- adiciona `.nojekyll`;
- falha quando scripts, folhas de estilo ou imagens locais estão ausentes.

## Deploy

Publique o conteúdo de `dist/` na raiz de um host estático. O projeto ainda utiliza
rotas absolutas e, portanto, não suporta deploy em subdiretórios sem uma etapa
adicional de prefixação de caminhos.

As integrações PHP e serviços externos de autenticação, pagamento e dados pessoais
não fazem parte deste repositório estático e exigem backends e credenciais
fornecidos separadamente pelo proprietário.
