const express = require("express")
const cors = require("cors")
const fs = require("fs")
const AlertService = require("./alertService")

const app = express()
app.use(cors())
app.use(express.json())

const CAMINHO_ARQUIVO = "./diagnostic.json"
const ARQUIVO_ALERTA = "./ALERTA_INTERVENCAO.txt"

app.post("/salvar", (req, res) => {
	const novoDiagnostico = req.body

	fs.readFile(CAMINHO_ARQUIVO, "utf8", (err, data) => {
		let jsonExistente = []

		if (!err && data) {
			try {
				jsonExistente = JSON.parse(data)
			} catch (e) {
				console.log("Arquivo vazio ou formato inválido, começando um novo.")
			}
		}

		jsonExistente.push(novoDiagnostico)

		fs.writeFile(CAMINHO_ARQUIVO, JSON.stringify(jsonExistente, null, 2), (err) => {
			if (err) {
				console.error("Erro ao salvar:", err)
				return res.status(500).send("Erro interno ao salvar o arquivo.")
			}

			console.log(`\nDiagnóstico salvo: ${novoDiagnostico.fileName}`)

			AlertService.analisarAutomacao(jsonExistente)

			res.send("Salvo com sucesso!")
		})
	})
})

app.listen(3000, () => {
	console.log("Servidor rodando! Escutando em http://localhost:3000")
})
