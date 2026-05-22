const express = require("express")
const cors = require("cors")
const fs = require("fs")
const AlertService = require("./alertService")
const Mailer = require("./mailingService")

const app = express()
app.use(cors())
app.use(express.json())

const CAMINHO_ARQUIVO = "./diagnostic.json"

app.post("/salvar", (req, res) => {
	const novoDiagnostico = req.body

	let jsonExistente = []

	try {
		const data = fs.readFileSync(CAMINHO_ARQUIVO, "utf8")
		if (data) jsonExistente = JSON.parse(data)
	} catch (e) {
		console.log("Arquivo vazio ou não encontrado, começando um novo.")
	}

	jsonExistente.push(novoDiagnostico)

	try {
		fs.writeFileSync(CAMINHO_ARQUIVO, JSON.stringify(jsonExistente, null, 2))
		console.log(`\nDiagnóstico salvo: ${novoDiagnostico.fileName}`)
		AlertService.analisarAutomacao(jsonExistente)
		res.send("Salvo com sucesso!")
	} catch (err) {
		console.error("Erro ao salvar:", err)
		res.status(500).send("Erro interno ao salvar o arquivo.")
	}
})

app.listen(3000, () => {
	console.log("Servidor rodando! Escutando em http://localhost:3000")
})
