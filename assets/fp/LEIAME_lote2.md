# Outremer — Sprites em primeira pessoa · Lote 2 (todas as armas e escudos)

Este lote **substitui o lote 1**: traz de novo os itens do lote 1 já corrigidos, mais todas as armas e escudos que faltavam. O sistema de camadas é o mesmo. Cada quadro tem **256×256 px**, e todas as camadas de uma família têm o mesmo tamanho e o mesmo pivô, então qualquer combinação de pele, luva, braçal, roupa e anel se encaixa pixel a pixel.

## O que mudou em relação ao lote 1
- **Cores dos ícones do jogo.** Cada arma foi repintada com as cores do seu ícone em `armas_icones.png`, mantendo a ordem de luz e sombra. Também valeu para os itens do lote 1:
  - a cabeça da **Maça** ficou cinza-ferro médio;
  - o **Cajado do Selo** ganhou haste clara com topo dourado;
  - o arco da **Besta** ficou bege claro, e não mais ferro escuro.
- **Arco**: agora tem 5 quadros (segurar, encaixar, meia_puxada, puxada_total, soltar), com o arco inteiro no quadro e as duas mãos presas ao arco e à corda. A **flecha virou uma camada separada** (`flecha.png`), vazia nos quadros segurar e soltar.
- **Besta**: o virote não aparece mais depois do disparo. `recarregar` virou uma pose própria: a besta fica de bico para baixo e a mão puxa a corda com o gancho.
- **Adaga**: ganhou golpe de estocada na família nova `estocada`. A rapieira e a espada curta também ganharam essa variante.
- **Escudo**: `baixar` agora é diferente de `bloqueio`: o escudo desce e vai para a esquerda.
- **Manoplas**: a crista dos nós dos dedos ficou mais suave.
- **Placas e manoplas**: o sombreamento ficou igual entre as famílias de mão nua e as de duas mãos.

## Organização
- `maos/<familia>/`: mãos e braços de cada **pose**, reaproveitados por todas as armas dessa pose.

| Família | Quadros | Itens |
|---|---|---|
| `uma_mao` | 0 repouso, 1 preparo, 2 golpe_inicio, 3 golpe, 4 finalizacao, 5 retorno, 6 bloqueio | Espada Longa, Espada Curta, Cimitarra, Falcione, Rapieira, Adaga, Maça, Maça-Estrela, Martelo de Guerra, Porrete, Mangual, Machadinha, Machadinha de Lenha, Machado de Batalha, Machado Duplo |
| `estocada` (nova) | 0 repouso, 1 recuo, 2 estocada | variante de Adaga, Rapieira, Espada Curta |
| `duas_maos_espada` (nova) | 0 repouso, 1 preparo, 2 golpe, 3 finalizacao, 4 bloqueio | Montante |
| `escudo` | 0 repouso, 1 erguer (mostra a frente), 2 bloqueio, 3 baixar | os 9 escudos |
| `cajado` | 0 repouso, 1 erguer, 2 conjurar | Cajado, Cajado do Selo, Cajado do Fogo, Cajado do Gelo, Varinha |
| `lanca` (armas de haste) | 0 repouso, 1 recuo, 2 estocada, 3 guarda_alta | Lança, Alabarda, Foice de Guerra, Pique |
| `arco` | 0 segurar, 1 encaixar, 2 meia_puxada, 3 puxada_total, 4 soltar | Arco Longo, Arco Curto |
| `besta` | 0 repouso, 1 mirar, 2 disparar, 3 recarregar | Besta, Besta Pesada |

- `<item>/`: só o que é do item, mais `<item>.json` com as animações e `previas/` (folha de combinações e GIF).
  - As camadas do item são `arma.png` ou `escudo.png`, `flecha.png` nos arcos e `brilho.png` nos cajados mágicos e na varinha.
  - Itens com variante têm a subpasta `<item>/estocada/` com as próprias folhas, e a chave `familias_extras` no JSON.
- `catalogo.json`: lista todas as famílias e todos os itens, com seus quadros, camadas, animações e variantes.
- `godot/ViewModel.gd`: script genérico para Godot 4. Ele lê o JSON do item e empilha as camadas, e agora também suporta `variante` e a camada `flecha`.
- `fontes_lote2/`: imagens-base em alta resolução de onde tudo foi extraído.

Cada camada vem em `folhas/<camada>.png` (quadros numa linha, `hframes` = número de quadros) e em `quadros/<camada>/NN_id.png`.

## Pivô
| Família | Pivô (canto do quadro preso à tela) | `offset` no Godot (`centered = false`) |
|---|---|---|
| uma_mao, estocada, duas_maos_espada, cajado | inferior direito | (-256, -256) |
| escudo | inferior esquerdo (mão esquerda) | (0, -256) |
| lanca, arco, besta | centro da borda de baixo | (-128, -256) |

Escala só por inteiros (2×, 3×…) com filtro **Nearest**. O escudo (esquerda) e uma arma de uma mão (direita) podem ser desenhados **ao mesmo tempo**, cada um no seu canto.

## Ordem das camadas (de baixo para cima)
1. `arma` / `escudo` (do item): cores fixas.
2. `flecha` (só arcos).
3. `manga_corpo`: **tingir** com a cor da roupa do corpo (multiplicação, `modulate`).
4. `braco_<tipo>` (opcional): `placas, couro, malha, cravejadas, lamelares, beduinas`.
5. Mão:
   - **sem luva:** `mao_pele` (**tingir** com a pele) e, por cima, `anel_<tipo>` (opcional: `cobre, prata, ouro, bronze, sinete, ambar, safira, rubi`).
   - **com luva:** `luva_<tipo>` (`couro, malha, manoplas, cravejadas, manoplas_ferro, linho`).
6. `brilho`: mistura **ADD**. Existe no Cajado do Selo (dourado), no Cajado do Fogo (laranja), no Cajado do Gelo (azul) e na Varinha (violeta). A intensidade cresce até o quadro de conjurar, e você pode pulsar a opacidade em código.

Braçais e luvas vêm de duas formas:
- `braco_couro.png`: já pintado.
- `braco_couro_cinza.png` + `braco_couro_detalhe.png`: para pintar com a **cor da armadura** (`modulate` na parte cinza; o detalhe vai por cima sem tingir).

## Godot
```gdscript
var vm := preload("res://outremer/godot/ViewModel.gd").new()
vm.item = "adaga"; vm.variante = "estocada"   # ou "" para os cortes da família uma_mao
vm.tipo_braco = "couro"; vm.tipo_luva = "couro"
add_child(vm)
await vm.tocar("estocada")
vm.usar_variante("")    # volta para os cortes
```
- Arcos: a camada `flecha` já some sozinha nos quadros 0 e 4. Para esconder em outros momentos (sem munição, por exemplo), use `mostrar_flecha(false)`.
- Mangual: corrente e bola já estão desenhadas em cada quadro com atraso de balanço; não precisa de física.

## Observações sobre os escudos novos
- Madeira, Redondo, Broquel, Pipa, Oval, Torre e Pavês usam os mesmos braços da família `escudo`.
- **Costas** (repouso, bloqueio, baixar):
  - tábuas de madeira com aro de ferro e rebites, e alças de couro com fivela de latão saindo pelos lados do braço;
  - o Broquel mostra o interior de ferro, sem alças, porque é empunhado só pelo punho;
  - Torre e Pavês têm travessas pregadas.
- **Frente** (só no quadro erguer), seguindo os ícones:
  - Madeira e Redondo: madeira, umbo de latão e aro cravejado;
  - Broquel: ferro com umbo de latão;
  - Pipa e Torre: cinza com cruz escura;
  - Oval e Pavês: madeira com cruz escura e aro cinza.
