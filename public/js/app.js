const lista = document.getElementById('listaColaboradores');
const form = document.getElementById('formColaborador');

const inputNome = document.getElementById('nome');
const inputRe = document.getElementById('re');
const inputCargo = document.getElementById('cargo');
const inputSalario = document.getElementById('salario');

const editId = document.getElementById('editId');
const editNome = document.getElementById('editNome');
const editCargo = document.getElementById('editCargo');
const editSalario = document.getElementById('editSalario');

const modalEditar = new bootstrap.Modal(
  document.getElementById('modalEditar')
);

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
        <td>R$ ${Number(c.salario_atual).toFixed(2)}</td>
        <td>
          <span class="badge ${c.status === 'Ativo' ? 'bg-success' : 'bg-secondary'}">
            ${c.status}
          </span>
        </td>
        <td>${c.empresas?.nome || ''}</td>
        <td>
          <button class="btn btn-sm btn-outline-primary"
            onclick='abrirEdicao(${JSON.stringify(c)})'>
            Editar
          </button>
          <button class="btn btn-sm btn-outline-warning"
            onclick="alterarStatus(${c.id}, '${c.status}')">
            Status
          </button>
        </td>
      </tr>
    `;
  });
}

form.addEventListener('submit', async e => {
  e.preventDefault();

  const response = await fetch('/colaboradores', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nome_completo: inputNome.value,
      re: inputRe.value,
      cargo: inputCargo.value,
      salario_atual: Number(inputSalario.value)
    })
  });

  const result = await response.json();

  if (!response.ok) {
    alert(result.message || 'Erro ao cadastrar');
    return;
  }

  alert(result.message);
  form.reset();
  carregarColaboradores();
});

function abrirEdicao(colab) {
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
