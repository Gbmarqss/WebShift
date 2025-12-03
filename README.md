# 🗓️ WebShift

O **WebShift** é uma aplicação web moderna para **gestão inteligente de escalas de voluntários**. 

Desenvolvido para automatizar a criação de escalas complexas, ele utiliza algoritmos para alocar pessoas em funções como Produção, Filmagem, Take e Iluminação, respeitando limites de atuação e regras de disponibilidade.

![WebShift Preview](./public/favicon.jpg)

## 🚀 Funcionalidades Principais

- **Automação Inteligente:** Lê planilhas de disponibilidade (.xlsx) e gera uma escala inicial automaticamente.
- **Lógica de Casal/Dupla:** Prioriza escalar pessoas específicas juntas (ex: Gabriel & Gabi) quando possível.
- **Prevenção de Burnout:** Alerta visual (🔥) quando um voluntário excede o limite saudável de escalas no mês (5+).
- **Detecção de Conflitos:** Bloqueia exportação se a mesma pessoa estiver em duas funções no mesmo dia.
- **Design Responsivo (LouveApp Style):** Interface moderna, adaptada para Celular e Desktop com Dark Mode automático.
- **Exportação Profissional:** - 📄 **PDF:** Relatório visual limpo separado por dias (estilo cartão).
  - 📊 **Excel:** Para edições manuais posteriores.
  - 📅 **ICS:** Para adicionar direto na agenda do celular (Google/Apple Calendar).
  - 💬 **WhatsApp:** Texto formatado com emojis pronto para envio.

## 🛠️ Tecnologias Utilizadas

- **Core:** React (Vite)
- **Estilização:** Tailwind CSS
- **Ícones:** Lucide React
- **Processamento de Dados:** SheetJS (xlsx)
- **Geração de Documentos:** jsPDF & jsPDF-AutoTable

## ⚙️ Como Configurar e Rodar

### Pré-requisitos
Tenha o [Node.js](https://nodejs.org/) instalado.

### Passo a Passo

1. **Clone o repositório:**
   ```bash
   git clone [https://github.com/SEU-USUARIO/webshift.git](https://github.com/SEU-USUARIO/webshift.git)
   cd webshift
