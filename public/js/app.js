const lista = document.getElementById('listaColaboradores');
const form = document.getElementById('formColaborador');

let modalEditar = new bootstrap.Modal(document.getElementById('modalEditar'));
let modalReajuste = new bootstrap.Modal(document.getElementById('modalReajuste'));

async function carregarColaboradores() {
  const res = await fetch('/colaboradores');
  const data = await res.json();

  lista.innerHTML = '';

  data.forEach(c => {
    lista.innerHTML += `
      <tr>
        <td>${c.nome_completo}</td>
        <td>${c.re}</td>
        <td>${c.cargo}</td>
        <td>R$ ${c.salario_atual.toFixed(2)}</td>
        <td>${c.status}</td>
        <td>${c.empresas?.nome || ''}</td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="abrirEdicao('${encodeURIComponent(JSON.stringify(c))}')">Editar</button>
          <button class="btn btn-sm btn-success" onclick="abrirReajuste(${c.id})">Reajustar</button>
          <button class="btn btn-sm btn-warning" onclick="alterarStatus(${c.id}, '${c.status}')">Status</button>
        </td>
      </tr>
    `;
  });
}

form.addEventListener('submit', async e => {
  e.preventDefault();

  const res = await fetch('/colaboradores', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nome_completo: nome.value,
      re: re.value,
      cargo: cargo.value,
      salario_atual: Number(salario.value)
    })
  });

  const result = await res.json();

  if (!res.ok) {
    alert(result.message);
    return;
  }

  alert(result.message);
  form.reset();
  carregarColaboradores();
});

function abrirEdicao(colab) {
  colab = JSON.parse(decodeURIComponent(colab));
  editId.value = colab.id;
  editNome.value = colab.nome_completo;
  editCargo.value = colab.cargo;
  editSalario.value = colab.salario_atual;
  modalEditar.show();
}

async function salvarEdicao() {
  await fetch(`/colaboradores/${editId.value}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nome_completo: editNome.value,
      cargo: editCargo.value,
      salario_atual: Number(editSalario.value)
    })
  });

  modalEditar.hide();
  carregarColaboradores();
}

function abrirReajuste(id) {
  reajusteId.value = id;
  reajustePercentual.value = '';
  reajusteBonus.value = '';
  modalReajuste.show();
}

async function salvarReajuste() {
  const res = await fetch(`/colaboradores/${reajusteId.value}/reajuste`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      percentual: Number(reajustePercentual.value),
      bonus: Number(reajusteBonus.value)
    })
  });

  const result = await res.json();
  if (!res.ok) {
    alert(result.message);
    return;
  }

  alert(result.message);
  modalReajuste.hide();
  carregarColaboradores();
}

async function alterarStatus(id, status) {
  await fetch(`/colaboradores/${id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: status === 'Ativo' ? 'Inativo' : 'Ativo'
    })
  });

  carregarColaboradores();
}

carregarColaboradores();
