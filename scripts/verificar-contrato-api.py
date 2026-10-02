"""Confere as chamadas HTTP do front contra o contrato versionado da API (T17).

Uso (na pasta do front):
    python scripts/verificar-contrato-api.py [caminho/para/contrato-api.json]
O padrão é ../servirea-api-back/docs/contrato-api.json. Sem o arquivo (por exemplo, na CI só do front) o script avisa e sai com
sucesso; defina CONTRATO_API para apontar para uma cópia. Só considera chamadas montadas com `environment.apiUrl` ou com a
constante `base`/`api` do próprio arquivo e compara o CAMINHO (o verbo não é inferido). Rotas que o front chama e a API
não tem aparecem com arquivo e linha.
"""
from pathlib import Path
import json
import os
import re
import sys

raiz = Path(__file__).resolve().parents[1]
alvo = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(os.environ.get('CONTRATO_API', raiz.parent / 'servirea-api-back' / 'docs' / 'contrato-api.json'))
if not alvo.exists():
    print(f'Contrato não encontrado em {alvo}; verificação pulada.')
    sys.exit(0)

contrato = json.loads(alvo.read_text(encoding='utf-8'))


def normalizar(caminho: str) -> str:
    caminho = caminho.split('?')[0].rstrip('/')
    caminho = re.sub(r'\{[^}/]*\}', '{}', caminho)
    return caminho


rotas = {normalizar(r['caminho']) for r in contrato['rotas']}
# Padrões com variável de caminho do tipo {token}.ics: o parâmetro pode ter sufixo.
rotas_regex = [re.compile('^' + re.escape(r).replace(re.escape('{}'), r'[^/]+') + '$') for r in rotas]

# Rotas chamadas por quem não é o front de negócio, ou que o front monta fora do padrão: lista deliberada.
IGNORAR = {'/', '/{}'}

atribuicao_base = re.compile(r'\b(?:base|api|raiz)\s*=\s*`\$\{environment\.apiUrl\}([^`]*)`')
uso = re.compile(r'`\$\{(?:environment\.apiUrl|this\.base|this\.api|this\.raiz|base|api)\}([^`]*)`')
aliases = re.compile(r'\$\{(?:this\.base|this\.api|this\.raiz|base|api)\}')

def casa_dinamico(caminho: str) -> bool:
    """Segmentos dinâmicos do front (ex.: /escalas/${id}/${acao}) podem ser também um trecho literal da rota."""
    padrao = re.compile('^' + re.escape(caminho).replace(re.escape('{}'), '[^/]+') + '$')
    return any(padrao.match(r) for r in rotas)


problemas = []
verificadas = 0
for arquivo in sorted((raiz / 'src' / 'app').rglob('*.ts')):
    if arquivo.name.endswith('.spec.ts'):
        continue
    texto = arquivo.read_text(encoding='utf-8')
    prefixos = atribuicao_base.findall(texto)
    prefixo = prefixos[0] if prefixos else ''
    for linha_n, linha in enumerate(texto.splitlines(), start=1):
        if atribuicao_base.search(linha):
            continue
        for m in uso.finditer(linha):
            bruto = m.group(1)
            # Quando a base do arquivo foi definida com sufixo (ex.: /voluntarios), junta antes de comparar.
            if re.search(r'\$\{(?:this\.base|this\.api|this\.raiz|base|api)\}', m.group(0)):
                bruto = prefixo + bruto
            caminho = normalizar(re.sub(r'\$\{[^}]*\}', '{}', bruto))
            if not caminho.startswith('/') or caminho in IGNORAR:
                continue
            verificadas += 1
            if caminho not in rotas and not any(r.match(caminho) for r in rotas_regex) and not casa_dinamico(caminho):
                problemas.append(f'{arquivo.relative_to(raiz)}:{linha_n}: {caminho}')

if problemas:
    print('Chamadas do front sem rota correspondente no contrato:')
    print('\n'.join(problemas))
    sys.exit(1)
print(f'{verificadas} chamadas do front conferidas contra {len(rotas)} rotas do contrato.')
