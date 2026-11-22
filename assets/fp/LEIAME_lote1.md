# Outremer — Sprites em primeira pessoa · Lote 1

Todos os itens usam o **mesmo sistema de camadas**. Cada quadro tem **256×256 px**, e todas as camadas de uma família têm o mesmo tamanho e o mesmo pivô, então qualquer combinação de pele, luva, braçal, roupa e anel se encaixa pixel a pixel.

## Organização
- `maos/<familia>/`: mãos e braços de cada **pose**, reaproveitados por todas as armas dessa pose.
  - `uma_mao`: espada longa, maça, machado de batalha, adaga (e no futuro: espada curta, cimitarra, martelo, machadinha…). 7 quadros: 00 repouso, 01 preparo, 02 golpe_inicio, 03 golpe, 04 finalizacao, 05 retorno, 06 bloqueio.
  - `escudo`: braço **esquerdo** por trás do escudo. 4 quadros: repouso, erguer (mostra a frente), bloqueio, baixar.
  - `cajado`: cajados e varinhas. 3 quadros: repouso, erguer, conjurar.
  - `lanca`: armas de haste com duas mãos. 4 quadros: repouso, recuo, estocada, guarda_alta.
  - `arco`: 3 quadros: segurar, mirar, soltar.
  - `besta`: 4 quadros: repouso, mirar, disparar, recarregar.
- `<item>/`: só o que é do item (`arma.png` ou `escudo.png`, e `brilho.png` no cajado), mais `<item>.json` com as animações e `previas/` (folha de combinações e GIF).
- `catalogo.json`: lista todas as famílias, todos os itens, seus quadros, camadas e animações.
- `godot/ViewModel.gd`: script genérico para Godot 4, que lê o JSON do item e empilha as camadas.
- `fontes_lote1/`: imagens-base em alta resolução de onde tudo foi extraído.

Cada camada vem em `folhas/<camada>.png` (quadros numa linha, `hframes` = número de quadros) e em `quadros/<camada>/NN_id.png`.

## Pivô
| Família | Pivô (canto do quadro preso à tela) | `offset` no Godot (`centered = false`) |
|---|---|---|
| uma_mao, cajado | inferior direito (mão direita) | (-256, -256) |
| escudo | inferior esquerdo (mão esquerda) | (0, -256) |
| lanca, arco, besta (duas mãos) | centro da borda de baixo | (-128, -256) |

Escala só por inteiros (2×, 3×…) com filtro **Nearest**. O escudo (esquerda) e uma arma de uma mão (direita) podem ser desenhados **ao mesmo tempo**, cada um no seu canto.

## Ordem das camadas (de baixo para cima)
1. `arma` / `escudo` (do item): cores fixas.
2. `manga_corpo`: **tingir** com a cor da roupa do corpo (multiplicação, `modulate`).
3. `braco_<tipo>` (opcional): `placas, couro, malha, cravejadas, lamelares, beduinas`.
4. Mão:
   - **sem luva:** `mao_pele` (**tingir** com a pele) e, por cima, `anel_<tipo>` (opcional: `cobre, prata, ouro, bronze, sinete, ambar, safira, rubi`).
   - **com luva:** `luva_<tipo>` (`couro, malha, manoplas, cravejadas, manoplas_ferro, linho`). A luva cobre a mão inteira.
5. `brilho` (só no cajado): mistura **ADD**. Pode pulsar a opacidade em código.

Braçais e luvas vêm de duas formas:
- `braco_couro.png`: já pintado nas cores do ícone do jogo.
- `braco_couro_cinza.png` + `braco_couro_detalhe.png`: para pintar com a **cor da armadura** (modulate na parte cinza; o detalhe, como rebites, tachas e fivelas, vai por cima sem tingir).

Tingimento: `cor_final = cinza × cor`. Escolha a cor como o tom mais claro desejado. Peles de exemplo: clara `#F2CCAA`, média `#C98C5E`, escura `#7E4E30`.

Nas famílias de duas mãos, as camadas `luva_*`, `braco_*` e `manga_corpo` cobrem **os dois braços** no mesmo PNG. O anel fica na mão direita (no escudo, na esquerda).

## Novidades da v2 (valem para todas as armas)
- **Manoplas** com volume extra, lâminas articuladas nos dedos, crista nos nós e placa lisa no dorso com reflexo. As manoplas de ferro têm rebites.
- **Braçais de placas** em lâminas sobrepostas, com junta escura, aresta clara, reflexo e rebites. Acabou o efeito xadrez.
- **Couro cravejado** com tachas maiores (3×3) em latão e sombra.
- **Malha** com padrão de anéis desencontrados que acompanha a direção do braço.
- **Anéis**: 8 tipos, só com a mão nua.
- **Espada Longa**: ganhou 2 quadros novos. A **finalização** agora aponta para baixo e à esquerda, bem diferente do golpe, e o **retorno** faz a ponte de volta ao repouso, suavizando o pulo do braço.
