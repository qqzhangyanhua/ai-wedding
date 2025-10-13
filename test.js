// OpenAI 以图生图 Demo
class ImageToImageGenerator {
    constructor() {
        this.imageFile = null;
        this.init();
    }

    init() {
        // 获取 DOM 元素
        this.uploadArea = document.getElementById('uploadArea');
        this.imageInput = document.getElementById('imageInput');
        this.imagePreview = document.getElementById('imagePreview');
        this.generateBtn = document.getElementById('generateBtn');
        this.loading = document.getElementById('loading');
        this.error = document.getElementById('error');
        this.resultSection = document.getElementById('resultSection');
        this.resultImages = document.getElementById('resultImages');

        // 绑定事件
        this.bindEvents();
    }

    bindEvents() {
        // 点击上传区域
        this.uploadArea.addEventListener('click', () => {
            this.imageInput.click();
        });

        // 文件选择
        this.imageInput.addEventListener('change', (e) => {
            this.handleFileSelect(e.target.files[0]);
        });

        // 拖拽上传
        this.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadArea.classList.add('dragover');
        });

        this.uploadArea.addEventListener('dragleave', () => {
            this.uploadArea.classList.remove('dragover');
        });

        this.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadArea.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                this.handleFileSelect(file);
            }
        });

        // 生成按钮
        this.generateBtn.addEventListener('click', () => {
            this.generateImage();
        });
    }

    handleFileSelect(file) {
        if (!file || !file.type.startsWith('image/')) {
            this.showError('请选择有效的图片文件');
            return;
        }

        this.imageFile = file;
        const reader = new FileReader();
        reader.onload = (e) => {
            this.imagePreview.src = e.target.result;
            this.imagePreview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }

    async generateImage() {
        // 验证输入
        const baseUrl = document.getElementById('baseUrl').value.trim();
        const model = document.getElementById('model').value.trim();
        const apiKey = document.getElementById('apiKey').value.trim();
        const prompt = document.getElementById('prompt').value.trim();
        const numImages = parseInt(document.getElementById('numImages').value) || 1;

        if (!baseUrl || !model || !apiKey) {
            this.showError('请填写完整的 API 配置信息');
            return;
        }

        if (!this.imageFile) {
            this.showError('请先上传一张图片');
            return;
        }

        if (!prompt) {
            this.showError('请输入提示词');
            return;
        }

        if (numImages < 1 || numImages > 10) {
            this.showError('生成数量必须在 1-10 之间');
            return;
        }

        // 显示加载状态
        this.showLoading(true);
        this.hideError();
        this.resultSection.style.display = 'none';

        try {
            // 准备表单数据
            const formData = new FormData();
            formData.append('image', this.imageFile);
            formData.append('prompt', prompt);
            formData.append('n', numImages.toString());
            formData.append('size', '1024x1024');

            // 构建 API 端点
            const apiUrl = `${baseUrl}/images/edits`;

            // 发送请求
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                },
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || `请求失败: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            
            // 显示结果
            this.displayResults(data.data);

        } catch (err) {
            this.showError(`生成失败: ${err.message}`);
            console.error('Error:', err);
        } finally {
            this.showLoading(false);
        }
    }

    displayResults(images) {
        this.resultImages.innerHTML = '';
        
        if (!images || images.length === 0) {
            this.showError('未生成任何图片');
            return;
        }

        images.forEach((img, index) => {
            const div = document.createElement('div');
            div.className = 'result-image';
            
            const imgElement = document.createElement('img');
            imgElement.src = img.url || img.b64_json ? `data:image/png;base64,${img.b64_json}` : '';
            imgElement.alt = `生成的图片 ${index + 1}`;
            
            // 添加下载功能
            imgElement.addEventListener('click', () => {
                const a = document.createElement('a');
                a.href = imgElement.src;
                a.download = `generated-image-${Date.now()}-${index + 1}.png`;
                a.click();
            });
            imgElement.style.cursor = 'pointer';
            imgElement.title = '点击下载图片';
            
            div.appendChild(imgElement);
            this.resultImages.appendChild(div);
        });

        this.resultSection.style.display = 'block';
    }

    showLoading(show) {
        this.loading.style.display = show ? 'block' : 'none';
        this.generateBtn.disabled = show;
    }

    showError(message) {
        this.error.textContent = message;
        this.error.style.display = 'block';
    }

    hideError() {
        this.error.style.display = 'none';
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new ImageToImageGenerator();
});

