document.addEventListener('DOMContentLoaded', () => {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const limiteMinimo = new Date(hoje);
  const limiteMaximo = new Date(hoje);
  limiteMaximo.setMonth(limiteMaximo.getMonth() + 3);

  const minDate = limiteMinimo.toISOString().split('T')[0];
  const maxDate = limiteMaximo.toISOString().split('T')[0];
  const defaultDate = maxDate;

  // Recria o campo de data com limites visíveis
  const campoAntigo = document.getElementById('dataParcela');
  const novoInput = document.createElement('input');
  novoInput.type = 'date';
  novoInput.id = 'dataParcela';
  novoInput.className = campoAntigo.className;
  novoInput.min = minDate;
  novoInput.max = maxDate;
  novoInput.value = defaultDate;
  campoAntigo.parentNode.replaceChild(novoInput, campoAntigo);

  const parcelasSelect = document.getElementById('parcelas');
  for (let i = 1; i <= 48; i++) {
    const option = document.createElement('option');
    option.value = i;
    option.textContent = i;
    parcelasSelect.appendChild(option);
  }

  const valorInput = document.getElementById('valor');
  valorInput.addEventListener('input', function (e) {
    let value = e.target.value.replace(/\D/g, '');
    value = (parseInt(value) / 100).toFixed(2);
    value = value.replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    e.target.value = 'R$ ' + value;
  });

  function getValorNumerico(mascara) {
    return parseFloat(mascara.replace(/[^\d,]/g, '').replace(',', '.'));
  }

  function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  }

  function adicionarMesesPreservandoDia(dataOriginal, mesesParaAdicionar) {
    const diaOriginal = dataOriginal.getDate();
    const novaData = new Date(dataOriginal);
    novaData.setMonth(novaData.getMonth() + mesesParaAdicionar);
    if (novaData.getDate() < diaOriginal) {
      novaData.setDate(0);
    }
    return novaData;
  }

  document.getElementById('simuladorForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const valor = getValorNumerico(valorInput.value);
    const parcelas = parseInt(parcelasSelect.value);
    const taxa = 1.68 / 100;
    const prestamista = 0.088;
    const tomador = 1;

    const dataSimulacao = new Date();
    dataSimulacao.setHours(0, 0, 0, 0);
    const dataParcelaInput = document.getElementById('dataParcela');
    const dataParcela = new Date(dataParcelaInput.value);
    dataParcela.setHours(0, 0, 0, 0);

    let totalFator = 0;
    let valorParcela = 0;
    let datas = [];
    let vencAnterior = null;

    for (let i = 0; i < parcelas; i++) {
      const vencAtual = adicionarMesesPreservandoDia(dataParcela, i);
      const diasIof = Math.floor((vencAtual - dataSimulacao) / (1000 * 60 * 60 * 24));
      const fator = Math.pow(1 / (1 + taxa), diasIof / 30);
      totalFator += fator;
      valorParcela = valor / totalFator;

      let dias = i === 0
        ? Math.round((dataParcela - dataSimulacao) / (1000 * 60 * 60 * 24))
        : Math.round((vencAtual - vencAnterior) / (1000 * 60 * 60 * 24));

      datas.push({ vencimento: vencAtual, dias, diasIof });
      vencAnterior = new Date(vencAtual);
    }

    let saldoAntes = valor;
    let totalJuros = 0;
    let totalIOF = 0;

    const resultado = document.getElementById('resultado');
    resultado.innerHTML = `
      <h2 class="text-xl font-semibold mb-4">Tabela de Parcelas</h2>
      <div class="overflow-x-auto">
        <table class="min-w-full text-sm text-left text-gray-700 border border-gray-300 rounded-lg">
          <thead class="bg-gray-100">
            <tr>
              <th class="px-4 py-2">#</th>
              <th class="px-4 py-2">Vencimento</th>
              <th class="px-4 py-2">Parcela</th>
            </tr>
          </thead>
          <tbody>
            ${datas.map((data, i) => {
              const juros = saldoAntes * (Math.pow(1 + taxa, data.dias / 30) - 1);
              const amortizacao = valorParcela - juros;
              const seguro = saldoAntes * prestamista / 100;
              const parcelaTotal = valorParcela + seguro;

              const iof = tomador === 1
                ? (data.diasIof <= 365 ? (data.diasIof * 0.0082 * amortizacao) / 100 : (3.00 * amortizacao) / 100)
                : (data.diasIof <= 365 ? (data.diasIof * 0.0041 * amortizacao) / 100 : (1.5 * amortizacao) / 100);

              totalJuros += juros;
              totalIOF += iof;

              saldoAntes -= amortizacao;

              return `
                <tr class="border-t">
                  <td class="px-4 py-2">${i + 1}</td>
                  <td class="px-4 py-2">${data.vencimento.toLocaleDateString('pt-BR')}</td>
                  <td class="px-4 py-2">${formatarMoeda(valorParcela)}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;

    const iofAdicional = valor * 0.01118;
    const totalIOFCompleto = totalIOF + iofAdicional;
    const totalPagar = valorParcela * parcelas;

    resultado.innerHTML += `
      <div class="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div class="bg-gray-100 p-4 rounded-md">
          <strong>Total a Pagar:</strong><br/>
          ${formatarMoeda(totalPagar)}
        </div>
      </div>
    `;
  });
});
