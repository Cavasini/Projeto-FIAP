const fs = require("fs")
const Mailer = require("./mailingService")

const LIMITE_INFECCAO = 0.3 // 30%
const MINIMO_AMOSTRAS = 3 // Mínimo de 3 folhas no talhão para considerar surto
const ARQUIVO_ALERTAS = "./alerts.json"

// Agora a função recebe os 'dados' diretamente do servidor
function analisarAutomacao(dados) {
	console.log("🔍 Rodando automação após novo salvamento...")

	const talhoes = {}

	dados.forEach((amostra) => {
		const loc = amostra.localidade || "Desconhecido"
		if (!talhoes[loc]) talhoes[loc] = { total: 0, doentes: 0, riscosCriticos: [] }

		talhoes[loc].total++

		if (amostra.estadoDefinido === "Doente") {
			talhoes[loc].doentes++

			const confianca = amostra.porcentagens ? amostra.porcentagens["Doente"] : 0
			if (confianca >= 85) {
				talhoes[loc].riscosCriticos.push(amostra)
			}
		}
	})

	let alertasGerados = []

	for (const [nomeTalhao, info] of Object.entries(talhoes)) {
		const taxaInfeccao = info.doentes / info.total

		// Regra 1: Surto
		if (taxaInfeccao > LIMITE_INFECCAO && info.total >= MINIMO_AMOSTRAS) {
			alertasGerados.push({
				tipo: "surto",
				local: nomeTalhao,
				mensagem: `Taxa: ${(taxaInfeccao * 100).toFixed(1)}% das amostras estão doentes.`,
			})
		}

		if (info.riscosCriticos.length > 0) {
			alertasGerados.push({
				tipo: "critico",
				local: nomeTalhao,
				mensagem: `${info.riscosCriticos.length} caso(s) com nível CRÍTICO (>85% de certeza). Acionar agrônomo.`,
			})
		}
	}

	fs.writeFileSync(ARQUIVO_ALERTAS, JSON.stringify(alertasGerados, null, 2))

	if (alertasGerados.length > 0) {
		console.log(`🚨 Automação: ${alertasGerados.length} alerta(s) gerado(s). alerts.json atualizado!`)
		Mailer.enviarAlertas(alertasGerados)
	} else {
		console.log("✅ Automação: Nenhuma anomalia crítica detectada no momento.")
	}
}

// Isso permite que o server.js "enxergue" esta função!
module.exports = { analisarAutomacao }
