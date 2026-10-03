"""Gera os tipos TypeScript da API a partir do contrato versionado do back (T17).

Uso (na pasta do front):
    python scripts/gerar-tipos-api.py             # reescreve src/app/core/api/contrato-api.gerado.ts
    python scripts/gerar-tipos-api.py --verificar # falha se o arquivo gerado estiver desatualizado

O contrato vem de ../servirea-api-back/docs/contrato-api.json (ou de CONTRATO_API / do 1º argumento que não seja flag).
Sem o contrato (CI só do front) o script avisa e sai com sucesso, como `verificar-contrato-api.py`.
Não edite o arquivo gerado: mude o DTO no back, regenere o contrato lá e rode este script aqui.
"""
from pathlib import Path
import json
import os
import re
import sys

raiz = Path(__file__).resolve().parents[1]
args = [a for a in sys.argv[1:] if not a.startswith('--')]
verificar = '--verificar' in sys.argv
alvo = Path(args[0]) if args else Path(os.environ.get('CONTRATO_API', raiz.parent / 'servirea-api-back' / 'docs' / 'contrato-api.json'))
saida = raiz / 'src' / 'app' / 'core' / 'api' / 'contrato-api.gerado.ts'

if not alvo.exists():
    print(f'Contrato não encontrado em {alvo}; geração pulada.')
    sys.exit(0)

contrato = json.loads(alvo.read_text(encoding='utf-8'))
esquemas = contrato['esquemas']

# Nome estável: classe aninhada leva o nome da classe-mãe (ex.: DistribuicaoDtos_Conflito), assim um DTO novo com o mesmo nome
# curto em outro módulo não renomeia os existentes; o que ainda colidir junta mais segmentos até ficar único.
def nomes_curtos(chaves):
    partes = {k: k.split('.') for k in chaves}
    nivel = {k: 2 if len(partes[k]) > 1 and partes[k][-2][:1].isupper() else 1 for k in chaves}
    while True:
        nomes = {k: '_'.join(partes[k][-nivel[k]:]) for k in chaves}
        contagem = {}
        for n in nomes.values():
            contagem[n] = contagem.get(n, 0) + 1
        colisoes = [k for k, n in nomes.items() if contagem[n] > 1 and nivel[k] < len(partes[k])]
        if not colisoes:
            return nomes
        for k in colisoes:
            nivel[k] += 1


nomes = nomes_curtos(sorted(esquemas))
qualificado = re.compile(r'[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)+')


def tipo_ts(texto: str, generico: bool = False) -> str:
    """Converte a notação do contrato (X, X[], X?, Record<string,X>, T) em tipo TypeScript."""
    t = texto.strip().rstrip('?')
    t = qualificado.sub(lambda m: nomes.get(m.group(0), 'unknown'), t)
    if not generico:
        t = re.sub(r'\bT\b', 'unknown', t)
    return t.replace(',', ', ')


def propriedade(nome: str) -> str:
    return nome if re.fullmatch(r'[A-Za-z_$][A-Za-z0-9_$]*', nome) else json.dumps(nome)


linhas = [
    '// GERADO por scripts/gerar-tipos-api.py a partir de servirea-api-back/docs/contrato-api.json. Não edite à mão.',
    '/* eslint-disable */',
    '',
]
for chave in sorted(esquemas, key=lambda k: nomes[k]):
    esquema = esquemas[chave]
    nome = nomes[chave]
    if 'enum' in esquema:
        linhas.append(f"export type {nome} = {' | '.join(repr(v) for v in esquema['enum'])};")
        linhas.append('')
        continue
    generico = any(re.search(r'\bT\b', v) for v in esquema.values())
    linhas.append(f"export interface {nome}{'<T = unknown>' if generico else ''} {{")
    for campo in sorted(esquema):
        bruto = esquema[campo]
        opcional = bruto.endswith('?')
        linhas.append(f"  {propriedade(campo)}{'?' if opcional else ''}: {tipo_ts(bruto, generico)}{' | null' if opcional else ''};")
    linhas.append('}')
    linhas.append('')

linhas.append('/** Rotas do contrato: chave "VERBO /caminho"; `corpo` e `resposta` são os DTOs declarados no controlador. */')
linhas.append('export interface ContratoRotas {')
vistas = set()
for rota in sorted(contrato['rotas'], key=lambda r: (r['caminho'], r['metodo'])):
    chave = f"{rota['metodo']} {rota['caminho']}"
    if chave in vistas:
        continue
    vistas.add(chave)
    corpo = tipo_ts(rota['corpo']) if rota['corpo'] else 'null'
    resposta = tipo_ts(rota['resposta']) if rota['resposta'] else 'void'
    linhas.append(f"  {json.dumps(chave)}: {{ corpo: {corpo}; resposta: {resposta} }};")
linhas.append('}')
linhas.append('')
linhas.append('export type RotaApi = keyof ContratoRotas;')
linhas.append("export type CorpoApi<R extends RotaApi> = ContratoRotas[R]['corpo'];")
linhas.append("export type RespostaApi<R extends RotaApi> = ContratoRotas[R]['resposta'];")
linhas.append('')

novo = '\n'.join(linhas)
if verificar:
    atual = saida.read_text(encoding='utf-8').replace('\r\n', '\n') if saida.exists() else ''
    if atual != novo:
        print(f'{saida.relative_to(raiz)} está desatualizado: rode `python scripts/gerar-tipos-api.py`.')
        sys.exit(1)
    print(f'Tipos da API em dia ({len(esquemas)} esquemas, {len(vistas)} rotas).')
    sys.exit(0)

saida.write_text(novo, encoding='utf-8', newline='\n')
print(f'{saida.relative_to(raiz)}: {len(esquemas)} esquemas, {len(vistas)} rotas.')
