import { Link } from 'react-router-dom';
import { useState } from 'react';

export default function ProductCard({ product, onPress }) {
  const [liked, setLiked] = useState(false);

  if (!product) return null;

  const getImage = () => {
    if (Array.isArray(product.images) && product.images.length) {
      const first = product.images[0];

      if (typeof first === 'string') return first;

      if (first?.url) return first.url;
    }

    return (
      product.image_url ||
      product.image ||
      '/placeholder.png'
    );
  };

  const price = Number(product.price || 0);
  const oldPrice = Number(product.original_price || 0);

  const discount =
    oldPrice > price
      ? Math.round(((oldPrice - price) / oldPrice) * 100)
      : null;


  return (
    <Link
      to={`/product/${product.id}`}
      onClick={onPress}
      style={{
        display:'block',
        background:'#fff',
        borderRadius:14,
        overflow:'hidden',
        border:'1px solid #eee',
        textDecoration:'none',
        color:'inherit',
        transition:'0.2s'
      }}
    >

      {/* IMAGE */}
      <div
        style={{
          height:220,
          position:'relative',
          background:'#f7f7f7',
          display:'flex',
          alignItems:'center',
          justifyContent:'center'
        }}
      >

        <img
          src={getImage()}
          alt={product.title}
          style={{
            width:'100%',
            height:'100%',
            objectFit:'contain'
          }}
          onError={(e)=>{
            e.currentTarget.src='/placeholder.png';
          }}
        />


        {discount && (
          <span
            style={{
              position:'absolute',
              top:10,
              left:10,
              background:'#e53935',
              color:'#fff',
              padding:'4px 8px',
              borderRadius:20,
              fontSize:12,
              fontWeight:700
            }}
          >
            -{discount}%
          </span>
        )}


        <button
          type="button"
          onClick={(e)=>{
            e.preventDefault();
            setLiked(!liked);
          }}
          style={{
            position:'absolute',
            right:10,
            top:10,
            width:34,
            height:34,
            borderRadius:'50%',
            border:'none',
            background:'#fff',
            cursor:'pointer',
            fontSize:18
          }}
        >
          {liked ? '❤️' : '♡'}
        </button>

      </div>


      {/* DETAILS */}
      <div style={{padding:14}}>


        <h3
          style={{
            fontSize:15,
            fontWeight:600,
            margin:'0 0 8px',
            lineHeight:1.4,
            minHeight:42,
            display:'-webkit-box',
            WebkitLineClamp:2,
            WebkitBoxOrient:'vertical',
            overflow:'hidden'
          }}
        >
          {product.title || 'Unnamed Product'}
        </h3>


        {/* Rating */}
        <div
          style={{
            fontSize:13,
            color:'#f59e0b',
            marginBottom:8
          }}
        >
          ★★★★★
          <span style={{color:'#777', marginLeft:5}}>
            ({product.reviews_count || 0})
          </span>
        </div>


        {/* PRICE */}
        <div>

          <strong
            style={{
              fontSize:17,
              color:'#16803c'
            }}
          >
            {product.currency || 'UGX'} {price.toLocaleString()}
          </strong>


          {oldPrice > price && (
            <div
              style={{
                fontSize:13,
                color:'#999',
                textDecoration:'line-through'
              }}
            >
              {product.currency || 'UGX'} {oldPrice.toLocaleString()}
            </div>
          )}

        </div>


        {product.shop_name && (
          <p
            style={{
              margin:'8px 0 0',
              fontSize:13,
              color:'#666'
            }}
          >
             {product.shop_name}
          </p>
        )}


        {(product.location_city || product.location_country) && (
          <p
            style={{
              margin:'4px 0 0',
              fontSize:12,
              color:'#888'
            }}
          >
             {product.location_city}, {product.location_country}
          </p>
        )}

      </div>

    </Link>
  );
}
