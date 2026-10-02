# Testes de navegação — T02

RouterTestingHarness do Angular usa guards/rotas reais e componentes lazy dos módulos; shell/login de teste e respostas de serviços/HTTP são controlados. Servirea cobre login antes de consultar dados, navegação liturgia/estoque, saída cancelada/confirmada preservando formulários, proteção de alterações do estoque e falha de indicadores sem zero fictício. Central cobre ausência de sessão, renovação por cookie simulada e troca de contratação cancelando consulta anterior no consumo.

Complemento dos testes unitários existentes; não é ensaio E2E com APIs reais, navegação por browser externo nem integração com Mercado Pago/Evolution. npm test usa ChromeHeadlessCI. CI já executa testes/build; a revisão não autoriza deploy. Fluxos completos de pessoa/evento/checkout com APIs reais, teclado/tela pequena e providers em staging permanecem na homologação.
