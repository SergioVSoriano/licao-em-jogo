"""Extrai o texto de um PDF para .txt (para o caderno do curador).

Uso: python scripts/conteudo/extrair-texto.py <arquivo.pdf> <saida.txt> [paginas, ex.: 21-29]
Precisa do PyMuPDF: pip install pymupdf
O texto sai como está no PDF, página a página, sem resumir nem corrigir nada.
"""
import sys


def main() -> int:
    if len(sys.argv) < 3:
        print(__doc__)
        return 1
    origem, destino = sys.argv[1], sys.argv[2]
    try:
        import pymupdf  # type: ignore
    except ImportError:
        try:
            import fitz as pymupdf  # type: ignore  # versões antigas
        except ImportError:
            print('PyMuPDF não está instalado. Rode: pip install pymupdf')
            return 2
    doc = pymupdf.open(origem)
    ini, fim = 1, doc.page_count
    if len(sys.argv) > 3:
        a, _, b = sys.argv[3].partition('-')
        ini, fim = int(a), int(b or a)
    partes = [f'# Texto extraído de: {origem} (páginas {ini} a {fim})\n']
    for i in range(ini - 1, min(fim, doc.page_count)):
        partes.append(f'\n--- página {i + 1} ---\n')
        partes.append(doc[i].get_text())
    with open(destino, 'w', encoding='utf-8') as f:
        f.write(''.join(partes))
    print(f'ok: {fim - ini + 1} pagina(s) -> {destino}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
