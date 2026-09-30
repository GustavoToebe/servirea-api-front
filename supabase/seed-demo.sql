-- Dados opcionais para teste. Execute somente depois do schema.sql.
insert into public.voluntarios
(nome_completo, data_nascimento, tipo, ativo, funcoes_habilitadas, celular, etapa_catequese)
values
('Gabriela Ortiz', '2013-04-10', 'COROINHA', true, array['CRUZ','VELA','SINO']::public.funcao_escala[], '(45) 99999-1001', '2º ano'),
('Henrique Luciano', '2009-08-18', 'ACOLITO', true, array['MISSAL']::public.funcao_escala[], '(45) 99999-1002', 'Concluída'),
('Laura Almeida', '2012-02-22', 'COROINHA', true, array['CREDENCIA','VELA','COLETA']::public.funcao_escala[], '(45) 99999-1003', '3º ano'),
('Pedro Henrique', '2011-11-05', 'AMBOS', true, array['MISSAL','CRUZ','SINO']::public.funcao_escala[], '(45) 99999-1004', '4º ano')
on conflict do nothing;
