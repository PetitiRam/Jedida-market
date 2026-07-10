import { useEffect, useState } from 'react';
import client from '../../api/client';
import { CATEGORIES, CONDITIONS } from '../../constants/categories';
import MediaUploader from '../../components/MediaUploader';
import { compressImage } from '../../utils/compressImage';
const emptyForm = {
  // Basic information
  title: '',
  shortDescription: '',
  description: '',
  category: 'other',
  condition: 'new',

  // Product identity
  brand: '',
  manufacturer: '',
  modelNumber: '',
  sku: '',

  // Pricing
  price: '',
  originalPrice: '',
  discount: '',
  currency: 'USD',

  // Inventory
  quantityAvailable: 1,
  minimumOrderQuantity: 1,

  // Specifications
  material: '',
  color: '',
  size: '',
  weight: '',
  dimensions: '',
  warranty: '',
  countryOfOrigin: '',

  // Media
  media: [],
  images: '',

  // Shipping
  locationCity: '',
  locationCountry: '',
  warehouseLocation: '',
  deliveryTime: '',
  shippingCost: '',

  // Extra product information
  features: '',
  packageContents: '',

  // SEO
  keywords: '',
  metaTitle: '',
  metaDescription: ''
};
export default function AddProductPanel() {
  const [form, setForm] = useState(emptyForm);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(false);

  const loadTemplates = async () => {
    const { data } = await client.get('/templates/mine');
    setTemplates(data.templates || []);
  };

  useEffect(() => {
    loadTemplates();
  }, []);

const update = (key) => (e) => {
  setForm((prev) => ({
    ...prev,
    [key]: e.target.value
  }));
};
  const removeMedia = (index) => {
    setForm((f) => ({
      ...f,
      media: f.media.filter((_, i) => i !== index)
    }));
  };

  const applyTemplate = (templateId) => {
    setSelectedTemplateId(templateId);
    const t = templates.find((tpl) => tpl.id === templateId);
    if (!t) return;

    setForm((f) => ({
      ...f,
      category: t.category,
      description:
        t.description_template
          ?.replace('{product_name}', f.title || '')
          .replace('{short_pitch}', '') || f.description,
      images: (t.suggested_image_urls || []).join(', ')
    }));
  };

  const generateTemplate = async () => {
    setGenerating(true);
    setError('');
    try {
      await client.post('/templates/generate', {
        category: form.category,
        productHint: form.title
      });
      await loadTemplates();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not generate a template right now.');
    } finally {
      setGenerating(false);
    }
  };
const uploadMedia = async (media, type) => {
  try {
    let uploadFile = media;

    if (type === 'image') {
      uploadFile = await compressImage(media);
    }

    return uploadFile;

  } catch (err) {
    throw new Error('Media processing failed');
  }
};
  const handleSubmit = async (e) => {
if(!form.title || !form.price){

setError(
'Product name and price are required'
);

setBusy(false);

return;

}
    e.preventDefault();
    setError('');
    setResult(null);
    setBusy(true);

    try {
const payload = {
  ...form,

  price: Number(form.price),
  originalPrice: Number(form.originalPrice || 0),
  discount: Number(form.discount || 0),

  quantityAvailable: Number(form.quantityAvailable),
  minimumOrderQuantity: Number(form.minimumOrderQuantity),

  shippingCost: Number(form.shippingCost || 0),

images: [
  ...form.media
    .filter((item) => item.type === 'image')
    .map((item) => item.url),

  ...(form.images
    ? form.images
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : [])
],
  templateId: selectedTemplateId || null
};
      const { data } = await client.post('/products', payload);
      setResult(data);
      setForm(emptyForm);
      setSelectedTemplateId('');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create your listing.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card-surface">
      <h3>List a new product</h3>

      <p style={{ color: '#5B6760' }}>
        Reuse a template, or let <strong>Colline</strong> generate one.
        Every listing is polished by <strong>Nsubuga Joseph</strong>.
      </p>

      {templates.length > 0 && (
        <div className="field-group">
          <label>Reuse a template</label>
          <select
            value={selectedTemplateId}
            onChange={(e) => applyTemplate(e.target.value)}
          >
            <option value="">— Start from scratch —</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <button
        type="button"
        className="btn-secondary"
        onClick={generateTemplate}
        disabled={generating}
        style={{ marginBottom: 20 }}
      >
        {generating ? 'Colline is generating…' : '✨ Generate a template'}
      </button>

      {error && <div className="alert alert-error">{error}</div>}

      {result && (
        <div className="alert alert-success">
          {result.message}
          {result.product?.ai_polish_notes && (
            <div style={{ marginTop: 6 }}>
              <em>Nsubuga Joseph's note:</em> {result.product.ai_polish_notes}
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit}>
{/* BASIC INFORMATION */}
<div className="card-section">
  <h4>📦 Basic Product Information</h4>

  <div className="field-group">
    <label>Product Name</label>
    <input
      value={form.title}
      onChange={update('title')}
      required
      placeholder="Example: Samsung Galaxy S24 Ultra"
    />
  </div>


  <div className="field-row">

    <div className="field-group">
      <label>Brand</label>
      <input
        value={form.brand}
        onChange={update('brand')}
        placeholder="Samsung"
      />
    </div>


    <div className="field-group">
      <label>Manufacturer</label>
      <input
        value={form.manufacturer}
        onChange={update('manufacturer')}
        placeholder="Samsung Electronics"
      />
    </div>

  </div>


  <div className="field-row">

    <div className="field-group">
      <label>Model Number</label>
      <input
        value={form.modelNumber}
        onChange={update('modelNumber')}
      />
    </div>


    <div className="field-group">
      <label>SKU</label>
      <input
        value={form.sku}
        onChange={update('sku')}
      />
    </div>

  </div>


  <div className="field-row">

    <div className="field-group">
      <label>Category</label>

      <select
        value={form.category}
        onChange={update('category')}
      >
        {CATEGORIES.map((c)=>(
          <option
            key={c.value}
            value={c.value}
          >
            {c.label}
          </option>
        ))}
      </select>

    </div>


    <div className="field-group">
      <label>Condition</label>

      <select
        value={form.condition}
        onChange={update('condition')}
      >
        {CONDITIONS.map((c)=>(
          <option
            key={c.value}
            value={c.value}
          >
            {c.label}
          </option>
        ))}
      </select>

    </div>

  </div>

</div>

{/* MEDIA SECTION */}
<div className="card-section">

<h4>🖼 Product Media</h4>

<p style={{color:'#666'}}>
The first image will be used as the product cover.
Upload clear images from different angles.
</p>


<div className="field-group">

<label>External Image URLs</label>

<input
value={form.images}
onChange={update('images')}
placeholder="Paste image URLs separated by commas"
/>

</div>



<div style={{
display:'flex',
gap:12,
flexWrap:'wrap'
}}>


<MediaUploader

label="Upload Product Image"

accept="image/*"

onUploaded={(media)=>{

setForm((prev)=>({

...prev,

media:[
...prev.media,
{
type:'image',
url:media.url
}
]

}));

}}

/>



<MediaUploader

label="Upload Product Video"

accept="video/*"

onUploaded={(media)=>{

setForm((prev)=>({

...prev,

media:
prev.media.length >= 10
?
prev.media
:
[
...prev.media,
{
type:'image',
url:media.url
}
]

}));
}}

/>


</div>



{/* MEDIA PREVIEW */}

<div style={{
marginTop:20
}}>


<h5>
Gallery Preview
</h5>


<div
style={{
display:'grid',
gridTemplateColumns:
'repeat(auto-fill,minmax(150px,1fr))',
gap:15
}}
>


{
form.media.map((item,index)=>(


<div

key={index}

style={{

border:'1px solid #ddd',

borderRadius:10,

padding:10,

position:'relative'

}}

>


{
index===0 &&

<div
style={{

background:'#0a7',

color:'white',

fontSize:12,

padding:'3px 8px',

borderRadius:5,

display:'inline-block'

}}

>

COVER IMAGE

</div>

}



{
item.type==='image' ?


<img

src={item.url}

alt="product"

style={{

width:'100%',

height:120,

objectFit:'cover',

borderRadius:8

}}

/>


:

<video

src={item.url}

controls

style={{

width:'100%',

height:120,

borderRadius:8

}}

/>

}



<button

type="button"

onClick={()=>removeMedia(index)}

style={{

marginTop:8,

width:'100%',

background:'#e53935',

color:'#fff',

border:'none',

padding:8,

borderRadius:6

}}

>

Remove

</button>


</div>


))

}


</div>


</div>


</div>

{/* PRICING */}
<div className="card-section">

<h4>💰 Pricing & Inventory</h4>


<div className="field-row">

<div className="field-group">
<label>Selling Price</label>

<input
type="number"
value={form.price}
onChange={update('price')}
required
/>

</div>


<div className="field-group">

<label>Currency</label>

<select
value={form.currency}
onChange={update('currency')}
>

<option value="USD">
USD
</option>

<option value="UGX">
UGX
</option>

<option value="KES">
KES
</option>

<option value="NGN">
NGN
</option>

</select>

</div>


</div>



<div className="field-row">


<div className="field-group">

<label>Original Price</label>

<input
type="number"
value={form.originalPrice}
onChange={update('originalPrice')}
/>

</div>



<div className="field-group">

<label>Discount (%)</label>

<input
type="number"
value={form.discount}
onChange={update('discount')}
/>

</div>


</div>



<div className="field-row">


<div className="field-group">

<label>Available Quantity</label>

<input
type="number"
value={form.quantityAvailable}
onChange={update('quantityAvailable')}
/>

</div>


<div className="field-group">

<label>Minimum Order Quantity</label>

<input
type="number"
value={form.minimumOrderQuantity}
onChange={update('minimumOrderQuantity')}
/>

</div>


</div>


</div>
{/* PRODUCT SPECIFICATIONS */}
<div className="card-section">

<h4>⚙ Product Specifications</h4>


<div className="field-row">

<div className="field-group">
<label>Material</label>

<input
value={form.material}
onChange={update('material')}
placeholder="Example: Aluminum, Cotton, Leather"
/>

</div>


<div className="field-group">

<label>Color</label>

<input
value={form.color}
onChange={update('color')}
placeholder="Black, White, Blue"
/>

</div>

</div>



<div className="field-row">


<div className="field-group">

<label>Size</label>

<input
value={form.size}
onChange={update('size')}
placeholder="Small, Medium, Large, 42"
/>

</div>



<div className="field-group">

<label>Weight</label>

<input
value={form.weight}
onChange={update('weight')}
placeholder="Example: 1.5kg"
/>

</div>


</div>



<div className="field-group">

<label>Dimensions</label>

<input
value={form.dimensions}
onChange={update('dimensions')}
placeholder="Example: 20cm x 15cm x 5cm"
/>

</div>



<div className="field-row">


<div className="field-group">

<label>Warranty</label>

<input
value={form.warranty}
onChange={update('warranty')}
placeholder="Example: 12 Months"
/>

</div>



<div className="field-group">

<label>Country of Origin</label>

<input
value={form.countryOfOrigin}
onChange={update('countryOfOrigin')}
placeholder="Example: Uganda, China, USA"
/>

</div>


</div>


</div>
{/* SHIPPING */}
<div className="card-section">

<h4>🚚 Shipping Information</h4>


<div className="field-row">


<div className="field-group">

<label>Warehouse Location</label>

<input
value={form.warehouseLocation}
onChange={update('warehouseLocation')}
placeholder="Example: Kampala Warehouse"
/>

</div>



<div className="field-group">

<label>Delivery Time</label>

<input
value={form.deliveryTime}
onChange={update('deliveryTime')}
placeholder="Example: 2-5 working days"
/>

</div>


</div>



<div className="field-row">


<div className="field-group">

<label>City</label>

<input
value={form.locationCity}
onChange={update('locationCity')}
/>

</div>



<div className="field-group">

<label>Country</label>

<input
value={form.locationCountry}
onChange={update('locationCountry')}
/>

</div>


</div>



<div className="field-group">

<label>Shipping Cost</label>

<input
type="number"
value={form.shippingCost}
onChange={update('shippingCost')}
/>

</div>


</div>
{/* DESCRIPTION */}
<div className="card-section">

<h4>📝 Product Description</h4>


<div className="field-group">

<label>Short Description</label>

<textarea
rows="2"
value={form.shortDescription}
onChange={update('shortDescription')}
placeholder="A short summary buyers see first"
/>

</div>



<div className="field-group">

<label>Full Description</label>

<textarea
rows="6"
value={form.description}
onChange={update('description')}
placeholder="Describe your product in detail"
/>

</div>



<div className="field-group">

<label>Key Features</label>

<textarea
rows="4"
value={form.features}
onChange={update('features')}
placeholder="Example:
• Fast charging
• Waterproof
• Original product
"
/>

</div>



<div className="field-group">

<label>Package Contents</label>

<textarea
rows="3"
value={form.packageContents}
onChange={update('packageContents')}
placeholder="What is included in the package?"
/>

</div>


</div>
{/* SEO SETTINGS */}
<div className="card-section">

<h4>🔍 Search Optimization</h4>


<div className="field-group">

<label>Search Keywords</label>

<input
value={form.keywords}
onChange={update('keywords')}
placeholder="phone, samsung, smartphone, electronics"
/>

</div>



<div className="field-group">

<label>Meta Title</label>

<input
value={form.metaTitle}
onChange={update('metaTitle')}
placeholder="Product title for search engines"
/>

</div>



<div className="field-group">

<label>Meta Description</label>

<textarea

rows="3"

value={form.metaDescription}

onChange={update('metaDescription')}

placeholder="Short description shown in search results"

/>

</div>

<div style={{
display:'flex',
gap:10
}}>


<button

type="button"

className="btn-secondary"

onClick={()=>{

setForm({

...form,

status:'draft'

})

}}

>

💾 Save Draft

</button>



<button

className="btn-primary"

disabled={busy}

>

{
busy
?
'Publishing...'
:
'🚀 Publish Product'
}

</button>


</div>
</div>
      </form>
{preview && (

<div

style={{

position:'fixed',

top:0,

left:0,

right:0,

bottom:0,

background:'rgba(0,0,0,.5)',

display:'flex',

justifyContent:'center',

alignItems:'center',

zIndex:1000

}}

>


<div

style={{

background:'#fff',

padding:25,

borderRadius:12,

maxWidth:600,

width:'90%'

}}

>


<h3>
{form.title || 'Product Preview'}
</h3>


{
form.media[0] &&

<img

src={form.media[0].url}

alt="preview"

style={{

width:'100%',

height:250,

objectFit:'cover',

borderRadius:10

}}

/>

}



<h4>
Price
</h4>

<p>

{form.currency}

{form.price}

</p>


<h4>
Specifications
</h4>


<p>
Brand: {form.brand}
</p>

<p>
Manufacturer: {form.manufacturer}
</p>

<p>
Material: {form.material}
</p>

<p>
Location:
{form.locationCity},
{form.locationCountry}

</p>



<button

className="btn-secondary"

onClick={()=>setPreview(false)}

>

Close Preview

</button>


</div>


</div>

)}
    </div>
  );
}
