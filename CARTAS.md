# Rumo ao Hexa — Guia Completo de Cartas

> Documento de referência para criação de novas cartas. Use este arquivo para entender o jogo, os formatos JSON e o inventário existente antes de propor novos conteúdos.

---

## 1. O Jogo

**Rumo ao Hexa** é um card game no estilo Reigns (escolha esquerda/direita) onde o jogador encarna um atacante brasileiro na Copa do Mundo 2026. O objetivo é chegar à final e vencer, conquistando o hexacampeonato para o Brasil.

São **7 partidas** (3 grupos + oitavas + quartas + semifinal + final). Em cada partida há **3 fases** de cartas:

```
PLANEJAR → REAGIR → ENTREVISTA → [próxima partida]
```

**Condições de derrota:**
- Qualquer barra atinge 0 ou 100 pela **segunda** vez (a primeira aciona uma crise)
- Resultado insuficiente na fase de grupos (< 5 pontos após 3 jogos)
- Derrota/empate em mata-mata

**Condição de vitória:** Ganhar a partida 7 (final)

---

## 2. As 4 Barras

| Barra | Descrição | Morrer em 0 | Morrer em 100 |
|-------|-----------|------------|--------------|
| `torcida` | Relação com a torcida brasileira | Vaias, a nação te abandonou | Superidolização — qualquer erro é traição |
| `midia` | Relação com a imprensa | Ostracismo total | Superexposição — cada erro vira manchete |
| `moral` | Estado mental/motivação do jogador | Colapso psicológico | Excesso de confiança — arrogância destrutiva |
| `fisico` | Condição física | Lesão incapacitante | Excesso de esforço — overtraining |

**Valores iniciais por arquétipo:**

| Arquétipo | torcida | midia | moral | fisico |
|-----------|---------|-------|-------|--------|
| estrela   | 70      | 65    | 60    | 65     |
| caido     | 55      | 80    | 50    | 50     |
| futuro    | 50      | 55    | 60    | 75     |

**Limiares de alerta:** ≤ 15 (zona de perigo baixo) / ≥ 85 (zona de perigo alto)

**Mecanismo de crise:** quando uma barra atinge 0 ou 100 pela primeira vez, a barra é resetada para 5 (se 0) ou 95 (se 100) e uma **carta de crise** é injetada no início do deck. Enquanto a crise estiver ativa, qualquer outra barra atingindo o extremo = **morte imediata**.

---

## 3. Os 3 Arquétipos

### `estrela` — A Estrela do Momento
- **Personagem:** Lucas, O Vendaval (#7)
- **História:** Homem do momento — torcida ama, imprensa equilibrada. Risco: excesso de expectativa. Adversários montam esquema só pra te parar.
- **Viés de mídia:** neutro (multiplicador ELOGIO 1.0×, CRITICA 1.0×)
- **Passiva:** `homem_marcado` — recebe carta especial na partida 2 (ass_estrela_alvo)

### `caido` — O Craque Caído
- **Personagem:** Mauricio Jr., O Príncipe (#10)
- **História:** Cirurgias, manchetes, ostracismo. Voltou quando ninguém acreditava. Imprensa é hostil, físico frágil. Run de redenção.
- **Viés de mídia:** hostil (multiplicador ELOGIO 0.5×, CRITICA 2.0×)
- **Passiva:** `divida_lesao` — lesões custam 1.5× mais; recebe `ass_principe_redencao` na partida 6
- **Niggle inicial:** `divida_lesao`

### `futuro` — O Futuro do País
- **Personagem:** Théo, O Menino (#19)
- **História:** 18 anos, primeira Copa, zero cobranças por enquanto. Mídia te trata como joia. Cada vitória acumula bônus de crescimento no placar (+1 ao limite de 3).
- **Viés de mídia:** permissivo (multiplicador ELOGIO 2.0×, CRITICA 0.5×)
- **Passiva:** `joia_bruta` — recebe `ass_menino_responsa` na partida 4

---

## 4. O Chaveamento (7 Partidas)

| # | Fase | Adversário | Classe | Alvo | Empate válido |
|---|------|-----------|--------|------|--------------|
| 1 | Grupo | Marrocos | `tecnico` | +2 | Sim |
| 2 | Grupo | Haiti | `saco_pancada` | +2 | Sim |
| 3 | Grupo | Escócia | `fisico` | +2 | Sim |
| 4 | Oitavas | Holanda | `favorito` | +2 | Não |
| 5 | Quartas | Senegal | `fisico` | +3 | Não |
| 6 | Semi | Argentina | `rival_historico` | +3 | Não |
| 7 | Final | França | `favorito` | +4 | Não |

**Alvo de vitória:** placar acumulado na fase `reagir` precisa ser ≥ alvo para vencer. Empate = placar entre 0 e alvo−1. Derrota = placar negativo.

---

## 5. As Fases por Partida

### Fase PLANEJAR (concentração / pré-jogo)
O jogador joga **2 a 4 cartas** sequencialmente, sem escolha de ordem.

Composição do deck:
1. **Carta âncora** (sempre): uma carta do pool `ancora`, selecionada por RNG seed-based (aleatória, reproduzível)
2. **Carta circo** (sempre): uma carta do pool `circo` (ou assinatura de circo, se existir para aquela partida — a assinatura tem prioridade e não consome RNG para circo)
3. **Carta especial de arquétipo** (se existir para arquétipo + partida): `requer_passiva`
4. **Carta de imprensa** (se midia extrema): `imprensa_favoravel` (midia ≥ 70) ou `imprensa_hostil` (midia ≤ 30)
5. **Carta de crise** (se crise ativa): injetada no início, antes de tudo

### Fase REAGIR (durante o jogo)
O jogador joga **5 cartas** sequencialmente:

- **Slots 0-3** (4 cartas): pool de 4 cartas, construído assim:
  - Começa com 4 genéricas aleatórias (embaralhadas com seed)
  - 1 substituição: carta da classe do adversário (ou 2, se classe = `evolucao`)
  - Se moral ≥ 70: slot 0 → `bonus_moral_alto`
  - Se moral ≤ 30: slot 0 → `crise_moral` (bonus)
  - Se físico ≥ 70: slot 3 → `bonus_fisico_alto`
  - Se físico ≤ 30: slot 3 → `cansaco_extremo`
  - Assinatura da partida (se existir): substitui slot 0 (posicao: inicio) ou slot 3 (posicao: fim)
- **Slot 4** (5ª carta): especial baseada em torcida
  - torcida ≥ 70: `especial_favoravel`
  - torcida ≤ 30: `especial_hostil`
  - torcida 31-69: `especial_neutro`

### Fase ENTREVISTA (pós-jogo)
O jogador joga **1 carta**. A carta é selecionada pela `flag` mais relevante acumulada durante a partida (processo via `resolveInterviewFlag`). Cada carta tem **3 variantes** (uma por arquétipo).

**Viés de mídia na entrevista:** efeitos em `midia` são modificados pelo `applyMediaBias`:
- Arquétipo + carga (ELOGIO/CRITICA) + nível atual de mídia determinam o multiplicador final
- Carga NEUTRA: efeito de midia passa sem modificação

---

## 6. Flags

### flags_partida (resetam após cada partida)
Acumuladas durante `reagir` e `planejar`. Determinam qual carta de entrevista aparece.

| Flag | Significado |
|------|-------------|
| `heroi` | Fez gol decisivo / momento épico |
| `afobado` | Perdeu chance clara / errou por ansiedade |
| `coletivo` | Priorizou o time sobre o individual |
| `vilao` | Comportamento antidesportivo |
| `pavio_curto` | Quase se envolveu em confusão |
| `showman` | Jogou para a arquibancada / exibicionismo |
| `boemio` | Saiu à noite / descumpriu concentração |
| `ousado` | Tomou decisões arriscadas |
| `raca` | Lutou além do limite físico |
| `frieza` | Manteve cabeça fria sob pressão |
| `disciplinado` | Seguiu o plano / jogou simples |
| `lider` | Puxou o time / liderou com exemplo |
| `covarde` | Recuou quando devia avançar |
| `arrogante` | Demonstrou excesso de ego em campo |
| `frio` | Versão mais discreta de frieza (circo) |
| `idolo` | Momento de conexão com a torcida |

### gancho_entrevista (trigger direto via escolha de carta)
Overrides a seleção normal de entrevista:

| Gancho | Carta de entrevista |
|--------|---------------------|
| `polemica` | ent_polemica |
| `cabeca_em_casa` | ent_cabeca_em_casa |
| `romance` | ent_romance |
| `climao_vestiario` | ent_climao_vestiario |
| `proposta_europa` | ent_proposta_europa |

### flag_carreira (persistem toda a run)
Acumuladas durante toda a campanha. Influenciam o legado final.

| Flag | Significado |
|------|-------------|
| `lider` | Líder nato, capitão |
| `humilde` | Postura humilde e responsável |
| `arrogante` | Prepotência fora de campo |
| `problematico` | Cria conflitos no grupo |
| `idolo` | Amado pela torcida |
| `vitrine` | Jogador de marketing, marca pessoal |
| `entregue` | 100% focado no clube/seleção |
| `mercenario` | Prioriza dinheiro sobre compromisso |
| `sobreviveu_crise` | Passou por crise e sobreviveu |

---

## 7. Formatos JSON das Cartas

### 7.1 Carta Padrão (planejar / reagir)

```json
{
  "id": "string — único, snake_case, prefixo do tipo (anc_, cir_, gen_, tec_, etc.)",
  "fase": "planejar | reagir",
  "naipe": "ancora | circo",
  "camada": "generica | classe | assinatura | bonus | especial | crise",
  "partida": 0,
  "requer_passiva": "estrela | caido | futuro",
  "requer_classe": "tecnico | fisico | favorito | rival_historico | saco_pancada | evolucao",
  "posicao": "inicio | fim",
  "texto": "Situação narrada em 1-3 frases. Tom jornalístico ou cinematográfico.",
  "esquerda": {
    "texto": "Texto do botão (máx 6 palavras, ação)",
    "efeitos": {
      "torcida": -15,
      "midia": 10,
      "moral": -5,
      "fisico": 8,
      "placar": 1
    },
    "flags_partida": ["flag1", "flag2"],
    "flag_carreira": "lider",
    "gancho_entrevista": "polemica",
    "niggle": "muscular",
    "climax": true,
    "risco": {
      "tipo": "string descritivo",
      "chance": 0.35,
      "efeitos": { "placar": -1 }
    },
    "condicional": {
      "limiar": 1,
      "ramoA": {
        "efeitos": { "placar": 2 },
        "flags_partida": ["heroi"],
        "climax": true
      },
      "ramoB": {
        "efeitos": { "placar": -1 },
        "flags_partida": ["afobado"],
        "climax": true
      }
    }
  },
  "direita": {
    "texto": "Texto do botão (máx 6 palavras, ação)",
    "efeitos": { "moral": 5 },
    "flags_partida": ["disciplinado"]
  }
}
```

**Regras de uso dos campos:**
- `naipe`: obrigatório apenas para cartas de planejar (ancora ou circo)
- `camada`: obrigatório para reagir; opcional para planejar (inferido pelo naipe)
- `partida`: número da partida onde a carta pode aparecer (1-7). Usar 0 para cartas de crise. Para `generica` e `classe`, usar 1 (aparecem em qualquer partida via shuffle)
- `requer_passiva`: a carta só entra no deck se o arquétipo do jogador bater
- `requer_classe`: a carta só entra se a classe do adversário bater
- `posicao`: apenas para assinaturas de reagir — força a posição no deck
- `climax`: sinaliza que a escolha representa o momento dramático da partida
- `risco`: evento aleatório que pode ou não acontecer (chance 0.0-1.0). O `tipo` é descritivo, **exceto** `"cartao_vermelho"` que tem comportamento especial: em mata-mata (partida ≥ 4) causa eliminação imediata (`causaMorte: 'expulsao'`); em grupos, aplica os efeitos normalmente sem eliminar.
- `condicional`: só quando `efeitos.placar === "condicional"`. `limiar` é o placar mínimo para `ramoA`; senão vai `ramoB`
- `niggle`: adiciona uma condição crônica que aumenta custo de dano físico
- `gancho_entrevista`: força qual carta de entrevista aparece após a partida

**Efeitos de placar (`placar`):**
- Número positivo: aumenta placar (gol, chance aproveitada)
- Número negativo: diminui placar (gol sofrido, erro)
- `0`: neutro
- `"condicional"`: resolução depende do placar atual vs limiar

---

### 7.2 Carta de Entrevista

```json
{
  "id": "ent_nome_flag",
  "fase": "entrevista",
  "partida": 1,
  "requer_flag": "heroi",
  "carga": "ELOGIO | CRITICA | NEUTRA",
  "variantes": {
    "estrela": {
      "pergunta": "Pergunta do repórter. Tom provocativo ou elogioso.",
      "esquerda": {
        "texto": "Resposta arrogante/polêmica",
        "efeitos": { "midia": 15, "torcida": -8 },
        "flag_carreira": "arrogante"
      },
      "direita": {
        "texto": "Resposta humilde/coletiva",
        "efeitos": { "torcida": 12, "moral": 5 },
        "flag_carreira": "humilde"
      }
    },
    "caido": { "pergunta": "...", "esquerda": {...}, "direita": {...} },
    "futuro": { "pergunta": "...", "esquerda": {...}, "direita": {...} }
  }
}
```

**Regras para entrevistas:**
- `carga` define como o viés de mídia é aplicado: ELOGIO amplifica midia positivamente, CRITICA amplifica negativamente, NEUTRA não aplica viés
- As 3 variantes DEVEM ter perguntas diferentes (personalizada para a história de cada arquétipo)
- Opção esquerda tende a ser a mais dramática/midiática; direita tende a ser mais contida
- Para cargas ELOGIO: evitar dar `midia` positiva em AMBAS as escolhas — isso infla a mídia sem custo
- Para cargas CRITICA: `midia` negativa em ambas é aceitável (crítica é crítica)
- A entrevista reseta todas as `flags_partida` ao final

---

### 7.3 Carta de Manchete (jornal pós-partida)

Não é um arquivo JSON separado — é gerado por regras em `engine/jornal.ts`. Cada regra tem:
- `flags`: lista de flags que ativam a regra (basta uma)
- `resultado`: `vitoria | derrota | empate` (opcional — sem este campo, vale para qualquer resultado)
- `opcoes`: array de `{ manchete: string, corpo: string }` — uma é sorteada aleatoriamente

**Tom:** manchetes em caixa alta, tom de jornal esportivo brasileiro. Corpo: 1-2 frases narrativas.

---

## 8. Inventário Completo de Cartas

### 8.1 PLANEJAR — Âncora (`naipe: "ancora"`)

| ID | Partida | Passiva | Descrição |
|----|---------|---------|-----------|
| `anc_treino_extra` | 1 | — | Treino extra de finalização |
| `anc_tatica` | 1 | — | Técnico quer dar mais responsabilidade |
| `anc_niggle` | 1 | — | Fisgada muscular no treino |
| `anc_fisio` | 1 | — | Protocolo de recuperação chato |
| `anc_night` | 2 | — | Grupo quer jantar fora na véspera |
| `anc_pressao_tecnico` | 2 | — | Técnico muda posição sem explicação |
| `anc_video` | 3 | — | Sessão de vídeo às 6h |
| `anc_briga_dupla` | 3 | — | Dois companheiros brigam no treino |
| `anc_capitao` | 4 | — | Capitão veterano pede compromisso |
| `anc_sono` | 4 | — | Noite sem dormir por ansiedade |
| `anc_imprensa_treino` | 5 | — | Imprensa pede treino aberto |
| `anc_reserva_reclama` | 5 | — | Reserva te acusa de monopolizar holofote |
| `anc_meditacao` | 6 | — | Psicólogo sugere mindfulness |
| `anc_estrela_carta_especial` | 2 | `estrela` | Peso do rótulo de craque do torneio |
| `anc_caido_carta_especial` | 3 | `caido` | Encontro com ex-companheiro cortado por você |
| `anc_futuro_carta_especial` | 2 | `futuro` | Veteranos fazem pegadinha de iniciação |

### 8.2 PLANEJAR — Circo (`naipe: "circo"`)

| ID | Partida | Passiva | Descrição |
|----|---------|---------|-----------|
| `cir_meme` | 1 | — | Figurinha tua vira meme nacional |
| `cir_videogame` | 1 | — | Flagrado jogando videogame de madrugada |
| `cir_torcedor` | 1 | — | Garotinho com camisa espera no hotel |
| `cir_polemica_antiga` | 1 | — | Tweet antigo ressuscitado |
| `cir_paternidade` | 2 | — | Parceira liga: vai ser pai, jogo é amanhã |
| `cir_live_rival` | 2 | — | Jogador rival te provoca em live |
| `cir_romance` | 3 | — | Vaza reatamento com influencer famosa |
| `cir_tatuagem` | 3 | — | Nova tatuagem no pescoço vira pauta |
| `cir_conselho_casa` | 4 | — | Post fofo sobre esposa vira zoeira no vestiário |
| `cir_vazamento_salario` | 4 | — | Portal vaza salário absurdo |
| `cir_cabelo` | 5 | — | Corte de cabelo ousado divide internet |
| `cir_documentario` | 5 | — | Plataforma quer documentário da sua Copa |
| `cir_grife` | 6 | — | Grife de luxo oferece cachê para usar roupa |
| `cir_troll_imprensa` | 6 | — | Jornalista te chama de mais superestimado da Copa |
| `cir_estrela_carta_especial` | 3 | `estrela` | Prêmio de melhor da fase de grupos |
| `cir_caido_carta_especial` | 4 | `caido` | Perfil anônimo posta compilado de erros históricos |
| `cir_futuro_carta_especial` | 3 | `futuro` | Capa de revista internacional como futuro do futebol |

### 8.3 PLANEJAR — Assinatura de Circo (`camada: "assinatura"`)

| ID | Partida | Descrição |
|----|---------|-----------|
| `ass_proposta_europa` | 4 | Vaza proposta recorde de clube europeu |

### 8.4 PLANEJAR — Imprensa (`naipe: "ancora"`)

| ID | Trigger | Descrição |
|----|---------|-----------|
| `imprensa_favoravel` | midia ≥ 70 | Imprensa do seu lado, favoritismo pesa |
| `imprensa_hostil` | midia ≤ 30 | Imprensa atacou antes do jogo |

### 8.5 PLANEJAR — Crise (`camada: "crise"`)

| ID | Trigger | Situação |
|----|---------|----------|
| `crise_midia` | midia atingiu 100 | Conta em site de apostas revelada |
| `crise_torcida` | torcida atingiu 100 | Fotos de festa na concentração vazam |
| `crise_moral` | moral atingiu 0 ou 100 | Empresário gravado sobre pedido de dispensa |
| `crise_fisico` | fisico atingiu 0 ou 100 | Amostra antidoping com anomalias |

---

### 8.6 REAGIR — Genéricas (`camada: "generica"`)

Pool de 40 cartas, 4 sorteadas aleatoriamente por partida (seed-based).

| ID | Situação |
|----|----------|
| `gen_falta_sofrida` | Falta na entrada da área — bater ou deixar pro especialista |
| `gen_contra_ataque` | Campo aberto, 3×2 — encarar sozinho ou servir companheiro |
| `gen_juiz_erra` | Impedimento inexistente anula gol |
| `gen_penalti_a_favor` | Pênalti marcado — cobrar ou passar |
| `gen_tempo_final` | 45+, placar empatado, última jogada |
| `gen_companheiro_livre` | Você marcado, camisa 9 livre |
| `gen_chuva` | Gramado escorregadio com temporal |
| `gen_vaia` | Torcida adversária vaia a cada toque seu |
| `gen_cansaco` | Pernas pesadas aos 70 min |
| `gen_lance_violento` | Adversário entra com sola na canela |
| `gen_gol_anulado_var` | Gol comemorado, VAR chamado |
| `gen_companheiro_expulso` | Time com um a menos por 30 min |
| `gen_torcida_canta` | Torcida canta SEU nome no meio do jogo |
| `gen_drible_sofrido` | Lateral te driba, galera faz olé |
| `gen_chance_clara` | Sobra limpa na pequena área |
| `gen_lider_cobra` | Capitão te briga na frente de todos |
| `gen_simulacao` | Queda leve na área — cavar o pênalti |
| `gen_provocacao_geral` | Adversário sussurra algo sobre sua família |
| `gen_apoio_reserva` | Reserva veterano dá dica tática no intervalo |
| `gen_lesao_leve` | Fisgada ao arrancar |
| `gen_chute_de_fora` | Chute forte de fora da área — arriscar |
| `gen_goleiro_adiantado` | Goleiro adiantado, você vê o gol vazio |
| `gen_marcador_gruda` | Marcador cola em você durante o jogo inteiro |
| `gen_recuo_falho` | Recuo do zagueiro mal executado, sobra |
| `gen_falta_tatica` | Você vê o contra-ataque vindo — falta tática |
| `gen_torcida_propria_vaia` | Sua própria torcida te vaia após recuo |
| `gen_caneta` | Você da caneta no marcador na frente da galera |
| `gen_pisao_escondido` | Zagueiro te pisa escondido do juiz |
| `gen_calor_sufocante` | Calor de 40°C, árbitro oferece pausa hidratação |
| `gen_companheiro_apagado` | Companheiro de ataque travado, depende de você |
| `gen_grama_pesada` | Grama alta e molhada, jogo travado |
| `gen_torcedor_invade` | Torcedor invade o campo e corre em sua direção |
| `gen_companheiro_brigado` | Companheiro brigou com você ontem, hoje evita |
| `gen_arbitragem_contra` | Árbitro marcou tudo contra, time no limite |
| `gen_passe_luxo` | Chance de passe de letra espetacular |
| `gen_substituicao_tatica` | Técnico vai te tirar — decide continuar ou reclamar |
| `gen_frango_goleiro` | Goleiro adversário falha feio, sobra para você |
| `gen_dois_amarelos` | Dois amarelos? Você está na iminência de sair |
| `gen_bola_fora_devolver` | Bola fora por saúde, eles querem de volta |
| `gen_companheiro_pede_passe` | Companheiro livre grita, mas você quer o gol |

### 8.7 REAGIR — Classe `tecnico` (Marrocos — partida 1)

| ID | Situação |
|----|----------|
| `tec_pressao_alta` | Marcação em cima desde a saída de bola |
| `tec_posse_deles` | Time adversário toca por 5 minutos |
| `tec_armadilha` | Linha de impedimento suíça |
| `tec_camisa10` | Camisa 10 deles dita o ritmo |
| `tec_paciencia` | Jogo trava, torcida impaciente |
| `tec_contra_golpe` | Perdeu a bola, eles saem em velocidade |
| `tec_brecha_unica` | Rara abertura na defesa organizada |

### 8.8 REAGIR — Classe `fisico` (Escócia — p3 / Senegal — p5)

| ID | Situação |
|----|----------|
| `fis_pancadaria` | Guerra física, eles são mais fortes |
| `fis_carrinho` | Carrinho atrasado em cheio |
| `fis_provocacao` | Zagueiro empurrando e xingando |
| `fis_jogo_aereo` | Bombardeio de bolas altas na área |
| `fis_desgaste` | Ritmo de pancada te esvazia |
| `fis_revide_tentador` | Adversário vulnerável de costas |
| `fis_lesao_dura` | Joelho trava numa dividida brutal |

### 8.9 REAGIR — Classe `favorito` (Holanda — p4 / França — p7)

| ID | Situação |
|----|----------|
| `fav_marcam_primeiro` | Eles abrem o placar com naturalidade |
| `fav_qualidade` | Cada toque deles é perfeito |
| `fav_pressao_placar` | Vocês precisam do gol, tempo corre |
| `fav_estrela_deles` | Craque deles faz jogada de outro mundo |
| `fav_respeito` | Capitão lendário te aborda no túnel |
| `fav_virada_possivel` | Você diminui, dá pra buscar a virada |

### 8.10 REAGIR — Classe `rival_historico` (Argentina — p6)

| ID | Situação |
|----|----------|
| `riv_final_antecipada` | Imprensa transformou em final antecipada |
| `riv_provocacao_rival` | Camisa 10 deles provoca sobre eliminações |
| `riv_torcida_dividida` | Metade do estádio é deles, hostil |
| `riv_historia` | Telão mostra fantasmas das eliminações |
| `riv_gol_rival` | Eles fazem gol e comemoram na sua cara |
| `riv_imortal` | Chance de ouro no clássico histórico |

### 8.11 REAGIR — Classe `saco_pancada` (Haiti — p2)

| ID | Situação |
|----|----------|
| `sac_favoritismo` | Todos já te deram a vitória antes do apito |
| `sac_pressao_goleada` | Torcida quer goleada e show |
| `sac_zagueiro_heroi` | Goleiro anônimo deles está travando tudo |
| `sac_humilhacao_risco` | Contra-ataque inesperado, tomar gol seria vexame |
| `sac_show_pessoal` | Jogo fácil, espaço para driblar e encantar |
| `sac_golear` | 5×0, sobra pra fazer mais um |

### 8.12 REAGIR — Classe `evolucao` (qualquer — injetada em par)

| ID | Situação |
|----|----------|
| `evo_talento_drible` | Camisa 10 deles (jovem) te driba |
| `evo_brecha_saida` | Zagueiro cru erra saída, sobra limpa |
| `evo_intensidade` | Jogam com energia de quem não tem nada a perder |
| `evo_brecha_ansiedade` | Afobam e deixam buraco no meio |
| `evo_jovem_promessa` | Joia deles é comparada a você |
| `evo_inconsistencia` | Relaxam achando ganho, vacilo coletivo |

### 8.13 REAGIR — Assinaturas (`camada: "assinatura"`)

| ID | Partida | Passiva | Posição | Situação |
|----|---------|---------|---------|----------|
| `ass_estreia` | 1 | — | inicio | Estreia numa Copa, hino, peso da nação |
| `ass_estrela_alvo` | 2 | `estrela` | — | Marcação dupla, esquema só pra você |
| `ass_muralha_escocesa` | 3 | — | fim | 89 min de batalha física, Escócia sem dar espaço |
| `ass_menino_responsa` | 4 | `futuro` | — | 18 anos com a braçadeira de responsabilidade |
| `ass_lesao_decisiva` | 5 | — | — | Algo estala numa arrancada |
| `ass_principe_redencao` | 6 | `caido` | — | 33 anos, 2 cirurgias, na semifinal |
| `ass_rivalidade_semi` | 6 | — | — | Brasil x Argentina na semi |
| `ass_capitao_passa_bracadeira` | 6 | — | — | Capitão se machuca, te entrega a braçadeira |
| `ass_chuva_de_papel` | 7 | — | — | Final, papel picado, 90 min da eternidade |
| `ass_maracana_fantasma` | 7 | — | inicio | Fantasmas de finais perdidas |
| `ass_penalti_final` | 7 | — | — | Pênalti nos últimos segundos da final |
| `ass_torcida_chora` | 7 | — | — | Torcida chorando com faltam segundos |

### 8.14 REAGIR — Bônus (`camada: "bonus"`)

| ID | Trigger | Situação |
|----|---------|----------|
| `bonus_moral_alto` | moral ≥ 70 | Entra mais focado do que nunca |
| `crise_moral` | moral ≤ 30 | Cabeça pesa antes do apito |
| `bonus_fisico_alto` | fisico ≥ 70 | Segundo tempo mais forte do que todos |
| `cansaco_extremo` | fisico ≤ 30 | Corpo cobra a conta, 25 min no limite |

### 8.15 REAGIR — Especiais por Torcida (`camada: "especial"`)

**Favorável** (torcida ≥ 70):

| ID | Situação |
|----|----------|
| `esp_onda_torcida` | Onda verde-amarela nos acréscimos |
| `esp_calor_casa` | Torcida que nunca parou de acreditar |

**Hostil** (torcida ≤ 30):

| ID | Situação |
|----|----------|
| `esp_vaias_decisao` | Vaias ensurdecedoras, cada toque hostil |
| `esp_pressao_maxima` | Hostilidade total, adversário aproveita |

**Neutro** (torcida 31-69):

| ID | Situação |
|----|----------|
| `esp_penalti_marcado` | Pênalti nos acréscimos |
| `esp_contra_decisivo` | Roubo de bola, só o goleiro na frente |
| `esp_cabecada_acrescimos` | Escanteio, você sobe mais alto |

---

### 8.16 ENTREVISTA

| ID | Flag Trigger | Carga | Tema |
|----|-------------|-------|------|
| `ent_heroi` | `heroi` | ELOGIO | Gol decisivo — arrogante alimenta mídia, humilde ganha torcida |
| `ent_afobado` | `afobado` | CRITICA | Erro por ansiedade — mídia cai em ambas, humilde ganha torcida |
| `ent_coletivo` | `coletivo` | ELOGIO | Jogo coletivo — líder ganha torcida, arrogante ganha mídia |
| `ent_vilao` | `vilao` | CRITICA | Comportamento antidesportivo |
| `ent_pavio_curto` | `pavio_curto` | CRITICA | Quase expulso por provocações |
| `ent_showman` | `showman` | NEUTRA | Jogou para a galeria |
| `ent_cabeca_em_casa` | `cabeca_em_casa` | NEUTRA | Cabeça estava em casa |
| `ent_romance` | `romance` | NEUTRA | Vida pessoal virou pauta |
| `ent_climao_vestiario` | `climao_vestiario` | NEUTRA | Boatos de briga no vestiário |
| `ent_polemica` | `polemica` | CRITICA | Resposta antiga polêmica reaquecida |
| `ent_fallback` | `fallback` | NEUTRA | Carta de fallback: avaliação geral do jogo |
| `ent_ousado` | `ousado` | ELOGIO | Arriscou, valeu — ou arriscou e falhou |
| `ent_raca` | `raca` | ELOGIO | Lutou além do limite — coragem física reconhecida |
| `ent_frieza` | `frieza` | ELOGIO | Cabeça fria sob pressão — imprensa quer saber o segredo |
| `ent_disciplinado` | `disciplinado` | ELOGIO | Seguiu o plano — reconhecimento pela consistência |
| `ent_lider` | `lider` | ELOGIO | Liderança em campo — capitão em espírito |
| `ent_covarde` | `covarde` | CRITICA | Recuou quando devia avançar — imprensa cobra |
| `ent_idolo` | `idolo` | ELOGIO | Conexão com a torcida — ídolo do povo |
| `ent_arrogante` | `arrogante` | CRITICA | Excesso de ego — imprensa e vestiário cobram |
| `ent_boemio` | `boemio` | CRITICA | Flagrado fora da concentração — imprensa ataca |
| `ent_proposta_europa` | `proposta_europa` | NEUTRA | Proposta europeia vazou — foco na seleção ou na carreira? |

---

## 9. Sistema de Manchetes (jornal.ts)

Gerado automaticamente após cada partida. Regras com prioridade por `flags_partida` da partida encerrada + resultado.

**Flags mapeadas atualmente:**
- Vitória: `heroi`, `lider`, `showman`, `ousado`, `raca`, `disciplinado`, `coletivo`, `frieza`, `idolo`
- Derrota: `vilao`, `covarde`, `pavio_curto`, `problematico`, `afobado`, `arrogante`
- Empate: `disciplinado`, `frieza`, `pavio_curto`, `raca`, `coletivo`, `heroi`

Quando múltiplas regras batem, **uma é sorteada aleatoriamente**. Cada regra tem 2-3 variantes de manchete.

**Determinismo:** toda seleção usa o RNG seed-based da run (`advanceSeed`/`seedToFloat`). Mesma seed = mesma manchete. O seed consumido pelo jornal é propagado para o estado e salvo, garantindo reprodutibilidade total.

---

## 10. Guia para Criação de Novas Cartas

### O que está faltando (prioridades)
1. **Mais cartas de entrevista** — há apenas 11, e o `requer_flag` só cobre algumas flags. Flags sem cobertura: `ousado`, `raca`, `frieza`, `disciplinado`, `lider`, `covarde`, `idolo`, `arrogante`, `boemio`
2. **Mais assinaturas de reagir** para partidas 2, 3, 4, 5 (só partidas 1, 5, 6 e 7 têm assinaturas neutras hoje)
3. **Mais cartas genéricas** — o pool de 20 é robusto mas pode crescer
4. **Mais regras de manchete** para flags ainda sem cobertura (frieza, disciplinado, coletivo em derrota, etc.)
5. **Mais opções nos specials** — cada pool de especial tem só 2-3 cartas

### Princípios de design
- **Escolhas com tradeoff real:** nunca ambas as opções têm o mesmo efeito dominante. Ex: esquerda dá mídia mas custa torcida; direita dá moral mas não dá mídia.
- **Tom narrativo:** escrever como se fosse uma transmissão ao vivo ou manchete de jornal. Sem linguagem genérica.
- **Efeitos calibrados:** barras vão de 0 a 100. Efeitos típicos: ±3 (suave), ±8 (moderado), ±15 (pesado), ±25 (crise). Evitar cartas onde ambas as opções apenas somam.
- **Flags coerentes:** a flag levantada deve fazer sentido para o acontecimento. `heroi` = momento decisivo positivo, `vilao` = comportamento antidesportivo, `lider` = ato de liderança coletiva.
- **Midia x torcida na entrevista:** para ELOGIO, a opção "polêmica" sobe midia; a opção "humilde" sobe torcida. Nunca dar midia positiva alta nas duas opções.
- **Risco:** chance entre 0.25 e 0.65. Abaixo de 0.25 é irrelevante, acima de 0.65 é quase certeza.
- **Condicional:** use quando o desfecho de uma jogada dramática deve depender do estado atual do placar — garante que momentos de desespero (placar ruim) sejam diferentes de momentos de conforto.
- **IDs únicos:** verificar que o ID não existe antes de criar. Prefixos: `anc_`, `cir_`, `gen_`, `tec_`, `fis_`, `fav_`, `riv_`, `sac_`, `evo_`, `esp_`, `ass_`, `ent_`, `crise_`

---

## 11. Seed e Compartilhamento de Run

Toda run tem uma **seed** numérica gerada no início (via `Date.now()`). A seed é usada para:
- Selecionar âncora e circo de planejar (RNG)
- Embaralhar o deck de genéricas (RNG)
- Resolver eventos de risco (`risco.chance`)
- Selecionar manchete do jornal (RNG)

A **`initialSeed`** é a seed original da run — nunca muda, mesmo quando o seed interno avança. É exibida no HUD como código hexadecimal de 8 caracteres (ex: `A3F2B910`) e na tela de game over com botão de copiar.

**Formato do código:** `seed.toString(16).toUpperCase().padStart(8,'0').slice(-8)`

Com o código, qualquer jogador pode reproduzir exatamente a mesma sequência de cartas e eventos de risco.
