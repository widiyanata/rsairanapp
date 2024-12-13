<template>
  <div class="signature-container">
    <canvas 
      ref="canvas" 
      :width="width" 
      :height="height" 
      class="border rounded shadow"
      style="width: 100%; max-width: 350px;"
    ></canvas>
    <div class="my-3">
      <div class="btn-group btn-group-sm">
        <button type="button" @click="clearCanvas" class="btn btn-danger">
          <i class="fas fa-trash"></i>
          <span class="sr-only">Hapus</span>
        </button>
        <button type="button" @click="toggleEraserMode" class="btn btn-warning">
          <i class="fas fa-eraser" v-if="isEraserMode"></i>
          <i class="fas fa-pen" v-else></i>
        </button>
        <!-- <button type="button" @click="removeLastStroke" class="btn btn-warning">Hapus Garis</button> -->
        <button @click="saveSignature" class="btn btn-success"> <i class="fas fa-save"></i> <span class="sr-only">Simpan</span>  </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "SignatureCanvas",
  props: {
    width: {
      type: Number,
      default: 330,
    },
    height: {
      type: Number,
      default: 230,
    },
    base64: {
      type: String,
      default: null,
    }
  },
  data() {
    return {
      ctx: null,
      isDrawing: false,
      lastPoint: { x: 0, y: 0 },
      isEraserMode: false, // Mode untuk brush penghapus
      strokes: [],
    };
  },
  mounted() {
    const canvas = this.$refs.canvas;
    this.ctx = canvas.getContext("2d");

    // Update cursor saat mode diubah
    this.$watch("isEraserMode", (newVal) => {
      canvas.classList.toggle("eraser-mode", newVal);
    });
    this.ctx.lineWidth = 2;
    this.ctx.lineCap = "round";
    this.ctx.lineJoin = "round";
    this.ctx.strokeStyle = "black";

    if (this.base64 != null) {
      this.clearCanvas();
      console.log('tanda tangan: ',this.base64)

      const image = new Image();
      image.src = this.base64;
      image.onload = () => {
        this.ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      };
    } else {
      this.clearCanvas();
    }

    // Event Desktop
    canvas.addEventListener("mousedown", this.startDrawing);
    canvas.addEventListener("mousemove", this.draw);
    canvas.addEventListener("mouseup", this.stopDrawing);
    canvas.addEventListener("mouseout", this.stopDrawing);

    // Event Mobile
    canvas.addEventListener("touchstart", this.startDrawing);
    canvas.addEventListener("touchmove", this.draw);
    canvas.addEventListener("touchend", this.stopDrawing);
  },
  methods: {
    getPoint(event) {
      if (event.touches && event.touches.length > 0) {
        const touch = event.touches[0];
        const rect = this.$refs.canvas.getBoundingClientRect();
        return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
      } else {
        return { x: event.offsetX, y: event.offsetY };
      }
    },
    startDrawing(event) {
      const point = this.getPoint(event);
      this.lastPoint = point;
      this.isDrawing = true;

      // Buat titik jika pengguna hanya mengetuk
      this.ctx.beginPath();
      this.ctx.arc(point.x, point.y, this.ctx.lineWidth / 2, 0, Math.PI * 2);
      this.ctx.fillStyle = this.ctx.strokeStyle;
      this.ctx.fill();
    },
    draw(event) {
      if (!this.isDrawing) return;
      const currentPoint = this.getPoint(event);

      // simpan garis
      this.strokes.push({
        start: { ...this.lastPoint },
        end: { ...currentPoint },
      });

      this.ctx.beginPath();
      this.ctx.moveTo(this.lastPoint.x, this.lastPoint.y);
      this.ctx.lineTo(currentPoint.x, currentPoint.y);
      this.ctx.stroke();

      this.lastPoint = currentPoint;
    },
    stopDrawing() {
      if (!this.isDrawing) return;
      this.isDrawing = false;
      this.ctx.closePath();
    },
    clearCanvas() {
      this.ctx.clearRect(0, 0, this.width, this.height);
    },
    isCanvasEmpty() {
      const canvas = this.$refs.canvas;
      const imageData = this.ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;

      // Cek apakah semua piksel transparan (RGBA = 0,0,0,0)
      for (let i = 0; i < pixels.length; i += 4) {
        if (pixels[i + 3] !== 0) {
          // Ada piksel tidak transparan
          return false;
        }
      }
      return true;
    },
    saveSignature() {
      if (this.isCanvasEmpty()) {
        // alert("Kanvas kosong, tidak dapat menyimpan tanda tangan.");
        Swal.fire('Gagal', 'Kanvas kosong, tidak dapat menyimpan tanda tangan.', 'error')
        return;
      }
      const dataURL = this.$refs.canvas.toDataURL("image/png");
      this.$emit("save", dataURL);
      // alert("Tanda tangan disimpan!");
      Swal.fire('Berhasil', 'Tanda tangan disimpan!', 'success')
    },

    toggleEraserMode() {
      this.isEraserMode = !this.isEraserMode;
      this.ctx.strokeStyle = this.isEraserMode ? "white" : "black"; // Putih untuk penghapus
      this.ctx.lineWidth = this.isEraserMode ? 10 : 2; // Sesuaikan ukuran kuas penghapus
    },

    removeLastStroke() {
      if (this.strokes.length === 0) return; // Tidak ada garis untuk dihapus

      // Hapus garis terakhir
      this.strokes.pop();

      // Bersihkan canvas
      this.clearCanvas();

      // Gambar ulang semua garis
      this.strokes.forEach((stroke) => {
        this.ctx.beginPath();
        this.ctx.moveTo(stroke.start.x, stroke.start.y);
        this.ctx.lineTo(stroke.end.x, stroke.end.y);
        this.ctx.stroke();
      });
    },

  },
  watch: {
    base64(newValue) {
      this.clearCanvas();
      // console.log('tanda tangan watch 1: ',newValue)
      if (newValue != null) {
        // console.log('tanda tangan watch 2: ',newValue)
        const image = new Image();
        image.src = newValue;
        image.onload = () => {
          this.ctx.drawImage(image, 0, 0, this.width, this.height);
        };
      } else {
        this.clearCanvas();
      }
    },
  },
};
</script>

<style scoped>
.signature-container {
  /* text-align: center; */
  /* margin-top: 20px; */
}
canvas {
  background-color: #fff;
  touch-action: none;
}

.signature-container canvas {
  cursor: crosshair;
}
.signature-container canvas {
  cursor: crosshair;
}

.signature-container canvas.eraser-mode {
  cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none'%3E%3Cpath d='M16 3L21 8L8 21L3 16L16 3Z' stroke='black' stroke-width='2'/%3E%3Cpath d='M9.5 16.5L13.5 12.5' stroke='black' stroke-width='2'/%3E%3C/svg%3E") 0 12, auto;
}


</style>
