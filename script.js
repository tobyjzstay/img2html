window.addEventListener("DOMContentLoaded", onLoad, false);

const colorCache = new Map();
const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");
let image;
let wrapper;
let imageError;

function onLoad() {
    image = document.getElementById("image-value");
    wrapper = document.querySelector(".wrapper");
    imageError = document.querySelector(".image-error");

    const pixelWidthForm = document.getElementById("pixel-width-form");
    pixelWidthForm.addEventListener("submit", generateTable, false);

    document.getElementById("image-form").addEventListener("submit", (e) => {
        e.preventDefault();
        const imageInput = document.getElementById("image-input");

        const file = imageInput.files[0];
        if (!file || !file.type.startsWith("image/")) {
            imageError.textContent = "Please select a valid image file.";
            image.src = "";
            wrapper.style.display = "none";
            return;
        } else imageError.textContent = "";

        const reader = new FileReader();
        reader.onload = (e) => {
            image.src = e.target.result;
            wrapper.style.display = "block";
        };
        reader.readAsDataURL(file);
    });
}

function generateTable(e) {
    e.preventDefault();
    colorCache.clear();

    const start = performance.now();

    if (!image.naturalWidth || !image.naturalHeight) return;
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const width = canvas.width;
    const height = canvas.height;

    const pxSkip = Number(document.getElementById("pixel-width").value);
    if (!Number.isInteger(pxSkip) || pxSkip < 1) return;

    const div = document.createElement("div");
    div.className = "image";

    ctx.drawImage(image, 0, 0);

    const result = document.getElementById("result");
    result.innerHTML = "";
    result.appendChild(div);

    const imageData = ctx.getImageData(0, 0, width, height).data;
    const fragment = document.createDocumentFragment();
    for (let j = 0; j < height; j += pxSkip) {
        const blockHeight = Math.min(pxSkip, height - j);
        const row = document.createElement("div");
        row.className = "row";
        row.style.height = `${blockHeight}px`;

        let prevColor = null;
        let pendingWidth = 0;
        let rowHtml = "";

        function flush() {
            rowHtml += `<span class="pixel" style="background:${rgbaIntToHex(prevColor)};width:${pendingWidth}px;"></span>`;
        }

        for (let i = 0; i < width; i += pxSkip) {
            const blockWidth = Math.min(pxSkip, width - i);
            const color = getAverageColor(
                imageData,
                i,
                j,
                width,
                height,
                blockWidth,
                blockHeight
            );


            if (prevColor === null) {
                prevColor = color;
                pendingWidth = blockWidth;
                continue;
            }

            if (prevColor === color) {
                pendingWidth += blockWidth;
            } else {
                flush();
                prevColor = color;
                pendingWidth = blockWidth;
            }
        }

        if (prevColor !== null && pendingWidth > 0) flush();

        row.innerHTML = rowHtml;
        fragment.appendChild(row);
    }
    div.appendChild(fragment);

    const seconds = ((performance.now() - start) / 1000).toFixed(2);

    result.appendChild(document.createTextNode(`Took ${seconds} seconds`));
}

function getAverageColor(
    data,
    x,
    y,
    width,
    height,
    blockWidth,
    blockHeight
) {
    let r = 0,
        g = 0,
        b = 0,
        a = 0,
        count = 0;

    const maxY = Math.min(y + blockHeight, height);
    const maxX = Math.min(x + blockWidth, width);

    for (let py = y; py < maxY; py++) {
        for (let px = x; px < maxX; px++) {
            const index = (py * width + px) * 4;

            r += data[index];
            g += data[index + 1];
            b += data[index + 2];
            a += data[index + 3];
            count++;
        }
    }

    r = Math.round(r / count);
    g = Math.round(g / count);
    b = Math.round(b / count);
    a = Math.round(a / count);

    return ((r << 24) | (g << 16) | (b << 8) | a) >>> 0;
}

function rgbaIntToHex(color) {
    let cached = colorCache.get(color);
    if (cached) return cached;

    cached = "#" + color.toString(16).padStart(8, "0");
    colorCache.set(color, cached);

    return cached;
}
