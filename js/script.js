
(function () {
"use strict";

const KEY = "dompet-cerdas-v3";

const CATS = {
    out: ["Makanan", "Transportasi", "Tagihan", "Belanja", "Hiburan", "Kesehatan", "Lainnya"],
    in: ["Gaji", "Usaha", "Hadiah", "Lainnya"]
};

let S = {
    tx: [],
    budget: 3000000,
    goal: {
        name: "Dana darurat",
        target: 5000000,
        saved: 0
    }
};

let type = "out";
let filter = "all";

const $ = id => document.getElementById(id);

const rupiah = n =>
    "Rp " + Math.round(n).toLocaleString("id-ID");

function load() {
    try {
        const data = JSON.parse(localStorage.getItem(KEY));

        if (data && Array.isArray(data.tx)) {
            S = { ...S, ...data };
        }
    } catch (e) {
        console.error("Gagal membaca data", e);
    }
}

function save() {
    try {
        localStorage.setItem(KEY, JSON.stringify(S));
        return true;
    } catch (e) {
        alert("Gagal menyimpan data.");
        return false;
    }
}

function categories() {
    $("cat").innerHTML = "";

    CATS[type].forEach(cat => {
        const option = document.createElement("option");
        option.value = cat;
        option.textContent = cat;
        $("cat").appendChild(option);
    });
}

function setType(value) {
    type = value;

    $("tOut").setAttribute(
        "aria-pressed", value === "out"
    );

    $("tIn").setAttribute(
        "aria-pressed", value === "in"
    );

    categories();
}

function totals() {
    let income = 0;
    let expense = 0;

    S.tx.forEach(t => {
        if (t.type === "in") income += t.amount;
        else expense += t.amount;
    });

    return {
        income,
        expense,
        balance: income - expense
    };
}

function render() {
    const total = totals();

    $("saldo").textContent = rupiah(total.balance);

    const now = new Date();
    const month = now.getFullYear() + "-" +
        String(now.getMonth() + 1).padStart(2, "0");

    let incomeMonth = 0;
    let expenseMonth = 0;

    S.tx.forEach(t => {
        if (t.date.startsWith(month)) {
            if (t.type === "in") incomeMonth += t.amount;
            else expenseMonth += t.amount;
        }
    });

    $("inM").textContent = rupiah(incomeMonth);
    $("outM").textContent = rupiah(expenseMonth);

    $("rate").textContent =
        incomeMonth > 0
            ? Math.round((incomeMonth - expenseMonth) / incomeMonth * 100) + "%"
            : "0%";

    $("budget").value = S.budget.toLocaleString("id-ID");

    const percent = S.budget > 0
        ? Math.min(100, expenseMonth / S.budget * 100)
        : 0;

    $("fill").style.width = percent + "%";
    $("fill").classList.toggle(
        "over",
        S.budget > 0 && expenseMonth > S.budget
    );

    $("insight").textContent =
        S.budget > 0
            ? "Pengeluaran bulan ini menggunakan " +
              Math.round(expenseMonth / S.budget * 100) +
              "% dari anggaran."
            : "Atur anggaran bulananmu.";

    $("tick").style.left =
        ((now.getDate() / new Date(
            now.getFullYear(),
            now.getMonth() + 1,
            0
        ).getDate()) * 100) + "%";

    renderWallets();
    renderHistory();
    renderGoal();
}

function renderWallets() {
    const container = $("wals");
    container.innerHTML = "";

    ["Tunai", "Bank", "E-wallet"].forEach(wallet => {
        const value = S.tx
            .filter(t => t.wallet === wallet)
            .reduce((sum, t) =>
                sum + (t.type === "in" ? t.amount : -t.amount), 0);

        const div = document.createElement("div");
        div.className = "chip";

        const label = document.createElement("span");
        label.className = "lbl";
        label.textContent = wallet;

        const amount = document.createElement("b");
        amount.textContent = rupiah(value);

        div.append(label, amount);
        container.appendChild(div);
    });
}

function renderHistory() {
    const container = $("history");
    container.innerHTML = "";

    let items = [...S.tx].sort(
        (a, b) => b.created - a.created
    );

    if (filter !== "all") {
        items = items.filter(t => t.type === filter);
    }

    if (!items.length) {
        container.textContent = "Belum ada transaksi.";
        container.className = "empty";
        return;
    }

    container.className = "";

    items.forEach(t => {
        const row = document.createElement("div");
        row.className = "item";

        const left = document.createElement("div");

        const title = document.createElement("strong");
        title.textContent = t.note || t.cat;

        const detail = document.createElement("small");
        detail.textContent =
            t.cat + " • " + t.wallet + " • " + t.date;

        left.append(title, detail);

        const right = document.createElement("div");

        const amount = document.createElement("strong");
        amount.className =
            t.type === "in" ? "plus" : "minus";

        amount.textContent =
            (t.type === "in" ? "+" : "-") + rupiah(t.amount);

        const del = document.createElement("button");
        del.className = "del";
        del.textContent = "Hapus";

        del.addEventListener("click", () => {
            if (!confirm("Hapus transaksi ini?")) return;

            const old = S.tx;
            S.tx = S.tx.filter(x => x.id !== t.id);

            if (!save()) {
                S.tx = old;
                return;
            }

            render();
        });

        right.append(amount, del);
        row.append(left, right);
        container.appendChild(row);
    });
}

function addTransaction() {
    const amount = parseInt(
        $("amount").value.replace(/\D/g, ""), 10
    );

    if (!Number.isSafeInteger(amount) || amount <= 0) {
        alert("Masukkan jumlah yang valid.");
        return;
    }

    const date = $("date").value;

    if (!date) {
        alert("Pilih tanggal transaksi.");
        return;
    }

    const item = {
        id: Date.now().toString() +
            Math.random().toString(36).slice(2),
        amount,
        type,
        cat: $("cat").value,
        date,
        wallet: $("wal").value,
        note: $("note").value.trim(),
        created: Date.now()
    };

    S.tx.push(item);

    if (!save()) {
        S.tx.pop();
        return;
    }

    $("amount").value = "";
    $("note").value = "";

    render();
    alert("Transaksi berhasil disimpan.");
}

function renderGoal() {
    $("goalName").value = S.goal.name;
    $("goalTarget").value =
        S.goal.target.toLocaleString("id-ID");
    $("goalSaved").value =
        S.goal.saved.toLocaleString("id-ID");

    const percent = S.goal.target > 0
        ? Math.min(100, S.goal.saved / S.goal.target * 100)
        : 0;

    $("goalProgress").textContent =
        "Tercapai " + Math.round(percent) + "% • " +
        rupiah(S.goal.saved) + " dari " +
        rupiah(S.goal.target);
}

function saveGoal() {
    const target = parseInt(
        $("goalTarget").value.replace(/\D/g, ""), 10
    );

    const saved = parseInt(
        $("goalSaved").value.replace(/\D/g, ""), 10
    );

    if (
        !Number.isSafeInteger(target) || target <= 0 ||
        !Number.isSafeInteger(saved) || saved < 0
    ) {
        alert("Periksa nominal target dan tabungan.");
        return;
    }

    const old = S.goal;

    S.goal = {
        name: $("goalName").value.trim() || "Target tabungan",
        target,
        saved
    };

    if (!save()) {
        S.goal = old;
        return;
    }

    renderGoal();
    alert("Target tabungan disimpan.");
}

function exportCSV() {
    const rows = [
        ["Tanggal", "Jenis", "Kategori", "Dompet", "Catatan", "Jumlah"]
    ];

    S.tx.forEach(t => {
        rows.push([
            t.date,
            t.type === "in" ? "Pemasukan" : "Pengeluaran",
            t.cat,
            t.wallet,
            t.note,
            t.amount
        ]);
    });

    const csv = rows.map(row =>
        row.map(value =>
            '"' + String(value).replace(/"/g, '""') + '"'
        ).join(",")
    ).join("\n");

    const blob = new Blob(
        ["\uFEFF" + csv],
        { type: "text/csv;charset=utf-8" }
    );

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = "laporan-dompet-cerdas.csv";
    a.click();

    URL.revokeObjectURL(url);
}

$("tOut").addEventListener("click", () => setType("out"));
$("tIn").addEventListener("click", () => setType("in"));

$("add").addEventListener("click", addTransaction);
$("saveGoal").addEventListener("click", saveGoal);
$("export").addEventListener("click", exportCSV);

$("filter").addEventListener("change", event => {
    filter = event.target.value;
    renderHistory();
});

$("budget").addEventListener("change", () => {
    const value = parseInt(
        $("budget").value.replace(/\D/g, ""), 10
    );

    if (!Number.isSafeInteger(value) || value < 0) {
        alert("Anggaran tidak valid.");
        return;
    }

    S.budget = value;
    save();
    render();
});

$("theme").addEventListener("click", () => {
    const dark =
        document.documentElement.dataset.theme !== "dark";

    document.documentElement.dataset.theme =
        dark ? "dark" : "light";

    localStorage.setItem(
        "dompet-theme",
        dark ? "dark" : "light"
    );
});

load();

const savedTheme = localStorage.getItem("dompet-theme");

if (savedTheme) {
    document.documentElement.dataset.theme = savedTheme;
}

$("date").value =
    new Date().toLocaleDateString("en-CA");

categories();
render();

})();
                       
