document.addEventListener('DOMContentLoaded', () => {
  const sistemaSelect = document.getElementById('sistema');
  const jurosInput = document.querySelector('input[disabled][value="1.68"]');

  sistemaSelect.addEventListener('change', () => {
    if (sistemaSelect.value === 'sac') {
      jurosInput.value = '0.1';
    } else {
      jurosInput.value = '1.68';
    }
  });


  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const limiteMinimo = new Date(hoje);
  const limiteMaximo = new Date(hoje);
  limiteMaximo.setMonth(limiteMaximo.getMonth() + 3);

  const minDate = limiteMinimo.toISOString().split('T')[0];
  const maxDate = limiteMaximo.toISOString().split('T')[0];
  const defaultDate = maxDate;

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

    const sistema = document.getElementById('sistema').value;
    const valor = getValorNumerico(valorInput.value);
    const parcelas = parseInt(parcelasSelect.value);
    const prestamista = 0.088;
    const tomador = 1;

    const dataSimulacao = new Date();
    dataSimulacao.setHours(0, 0, 0, 0);
    const dataParcela = new Date(document.getElementById('dataParcela').value);
    dataParcela.setHours(0, 0, 0, 0);

    const resultado = document.getElementById('resultado');
    resultado.innerHTML = '';

    if (sistema === 'price') {
      const taxa = 1.68 / 100;
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
      let totalIOF = 0;

      resultado.innerHTML += `
        <h2 class="text-xl font-semibold mb-4">Tabela PRICE</h2>
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

              totalIOF += iof;
              saldoAntes -= amortizacao;

              return `<tr class="border-t">
                <td class="px-4 py-2">${i + 1}</td>
                <td class="px-4 py-2">${data.vencimento.toLocaleDateString('pt-BR')}</td>
                <td class="px-4 py-2">${formatarMoeda(valorParcela)}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      `;

      const iofAdicional = valor * 0.01118;
      const totalPagar = valorParcela * parcelas;

      resultado.innerHTML += `
        <div class="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div class="bg-gray-100 p-4 rounded-md">
            <strong>Total a Pagar:</strong><br/>
            ${formatarMoeda(totalPagar)}
          </div>
        </div>
      `;
    }

    if (sistema === 'sac') {
  const taxaBase = 0.1;
  const cdi = 14.90;
  const taxa = (taxaBase + cdi) / 100; // igual ao PHP

  const amortizacao = valor / parcelas;
  let saldoDevedor = valor;
  let totalPagar = 0;
  let vencAnterior = null;

  resultado.innerHTML += `
    <h2 class="text-xl font-semibold mb-4">Tabela SAC</h2>
    <table class="min-w-full text-sm text-left text-gray-700 border border-gray-300 rounded-lg">
      <thead class="bg-gray-100">
        <tr>
          <th class="px-4 py-2">#</th>
          <th class="px-4 py-2">Vencimento</th>
          <th class="px-4 py-2">Parcela</th>
        </tr>
      </thead>
      <tbody>
        ${Array.from({ length: parcelas }, (_, i) => {
          const venc = adicionarMesesPreservandoDia(dataParcela, i);
          const dias = i === 0
            ? Math.round((venc - dataSimulacao) / (1000 * 60 * 60 * 24))
            : Math.round((venc - vencAnterior) / (1000 * 60 * 60 * 24));

          const diasIof = Math.round((venc - dataSimulacao) / (1000 * 60 * 60 * 24));

          let juros = 0;
          if (i > 0) {
            juros = saldoDevedor * (Math.pow(1 + taxa, dias / 30) - 1);
          }

          const valorParcela = amortizacao + juros;
          const seguro = saldoDevedor * prestamista / 100;
          const parcelaTotal = valorParcela + seguro;

          let iof = 0;
          if (tomador === 1) {
            iof = diasIof <= 365
              ? (diasIof * 0.0082 * amortizacao) / 100
              : (3.00 * amortizacao) / 100;
          } else {
            iof = diasIof <= 365
              ? (diasIof * 0.0041 * amortizacao) / 100
              : (1.5 * amortizacao) / 100;
          }

          vencAnterior = new Date(venc);
          saldoDevedor -= amortizacao;
          totalPagar += parcelaTotal;

          return `<tr class="border-t">
            <td class="px-4 py-2">${i + 1}</td>
            <td class="px-4 py-2">${venc.toLocaleDateString('pt-BR')}</td>
            <td class="px-4 py-2">${formatarMoeda(valorParcela)}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
  `;

  resultado.innerHTML += `
    <div class="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
      <div class="bg-gray-100 p-4 rounded-md">
        <strong>Total a Pagar:</strong><br/>
        ${formatarMoeda(totalPagar)}
      </div>
    </div>
  `;
}
  });
});
