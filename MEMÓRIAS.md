# Bugs rastreados

- 2026-07-21 — `index.html` calendário: o listener descartava o evento e `selectDate` acessava o global implícito `event`, interrompendo a seleção de datas em navegadores sem esse legado — https://github.com/ksgs2901-cmd/empregoscorreio/pull/1 — aberto
