window.addEventListener("DOMContentLoaded", onLoad, false);
function onLoad() {
    const pixelWidthForm = document.getElementById("pixel-width-form");
    pixelWidthForm.addEventListener("submit", generateTable, false);

    document.getElementById("image-form").addEventListener("submit", (e) => {
        e.preventDefault();
        const imageInput = document.getElementById("image-input");

        const file = imageInput.files[0];
        if (!file.type.match(/image\/*/)) {
            document.querySelector(".image-error").textContent = "Please select a valid image file.";
            document.getElementById("image-value").src = "";
            document.querySelector(".wrapper").style.display = "none";
            return;
        } else {
            document.querySelector(".image-error").textContent = "";
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById("image-value").src = e.target.result;
            document.querySelector(".wrapper").style.display = "block";
        };
        reader.readAsDataURL(file);
    });
}

function generateTable(e) {
    e.preventDefault();
    const pixelWidth = document.getElementById("pixel-width");

    const pxSkip = parseInt(pixelWidth.value);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const image = new Image();
    image.src = document.getElementById("image-value").getAttribute("src");
    image.onload = function () {
        const start = performance.now();
        const table = document.createElement("table");
        canvas.width = image.width;
        canvas.height = image.height;

        ctx.drawImage(image, 0, 0);

        const style = document.createElement("style");
        style.appendChild(document.createTextNode(`td { height: ${pxSkip}px; }`));

        const result = document.getElementById("result");
        result.innerHTML = "";
        result.appendChild(table);
        result.appendChild(style);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        for (let j = 0; j < canvas.height; j += pxSkip) {
            const row = document.createElement("tr");
            let prevColor = null;
            let count = 0;
            for (let i = 0; i < canvas.width; i += pxSkip) {
                const color = getAverageColor(imageData, i, j, canvas.width, pxSkip);

                if (count === 1000) count = 0; // table cell limit
                if (prevColor === color) {
                    count++;
                    if (i + pxSkip >= canvas.width || count === 1000) createColorCell(row, prevColor, count, pxSkip);
                } else {
                    if (prevColor) createColorCell(row, prevColor, count, pxSkip);
                    prevColor = color;
                    count = 1;
                }
            }
            table.appendChild(row);
        }

        const end = performance.now();
        result.appendChild(document.createTextNode("Took " + (~~(((end - start) / 1000) * 100) / 100 + " seconds")));
    };
}

function getAverageColor(data, x, y, width, pxSkip) {
    let r = 0,
        g = 0,
        b = 0,
        a = 0,
        count = 0;

    for (let dy = 0; dy < pxSkip; dy++) {
        for (let dx = 0; dx < pxSkip; dx++) {
            let index = ((y + dy) * width + (x + dx)) * 4;
            r += data[index];
            g += data[index + 1];
            b += data[index + 2];
            a += data[index + 3];
            count++;
        }
    }

    return rgbToHex(Math.round(r / count), Math.round(g / count), Math.round(b / count), Math.round(a / count));
}

function rgbToHex(r, g, b, a) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b) + componentToHex(a);
}

function componentToHex(c) {
    let hex = c.toString(16);
    return String(hex.length === 1 ? "0" + hex : hex);
}

function createColorCell(row, color, count, pxSkip) {
    const col = document.createElement("td");
    col.style.background = color;
    col.style.width = `${count * pxSkip}px`;
    col.colSpan = count;
    row.appendChild(col);
}
