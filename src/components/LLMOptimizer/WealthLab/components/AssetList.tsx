import { useState, useCallback, useMemo, memo } from 'react';
import { useWealthStore } from '@/services/wealth/wealthStore';
import { Plus, Edit, Trash2 } from 'lucide-react';
import type { Asset, AssetType } from '@/types/wealth';

const AssetList = memo(function AssetList() {
  const assets = useWealthStore((state) => state.assets);
  const addAsset = useWealthStore((state) => state.addAsset);
  const updateAsset = useWealthStore((state) => state.updateAsset);
  const deleteAsset = useWealthStore((state) => state.deleteAsset);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const assetsByType = useMemo(() => {
    const grouped: Record<AssetType, Asset[]> = {
      stock: [],
      etf: [],
      bond: [],
      mutual_fund: [],
      crypto: [],
      real_estate: [],
      cash: [],
      domain: [],
      collectible: [],
      other: [],
    };

    assets.forEach((asset) => {
      grouped[asset.type].push(asset);
    });

    return grouped;
  }, [assets]);

  const handleAddAsset = useCallback(() => {
    setShowAddForm(true);
  }, []);

  const handleDeleteAsset = useCallback(
    (id: string) => {
      if (confirm('Are you sure you want to delete this asset?')) {
        deleteAsset(id);
      }
    },
    [deleteAsset]
  );

  const totalValue = useMemo(() => {
    return assets.reduce((sum, asset) => sum + asset.value, 0);
  }, [assets]);

  return (
    <div className="asset-list">
      <div className="asset-list-header">
        <h3>Assets</h3>
        <div className="asset-list-actions">
          <div className="asset-total">
            Total Value: <strong>${totalValue.toLocaleString()}</strong>
          </div>
          <button className="asset-add-btn" onClick={handleAddAsset}>
            <Plus size={16} />
            <span>Add Asset</span>
          </button>
        </div>
      </div>

      {showAddForm && (
        <AssetForm
          onSave={(asset) => {
            addAsset(asset);
            setShowAddForm(false);
          }}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      <div className="asset-list-content">
        {Object.entries(assetsByType)
          .filter(([_, assets]) => assets.length > 0)
          .map(([type, typeAssets]) => (
            <div key={type} className="asset-type-group">
              <h4 className="asset-type-header">{type.replace('_', ' ').toUpperCase()}</h4>
              <div className="asset-items">
                {typeAssets.map((asset) => (
                  <div key={asset.id} className="asset-item">
                    <div className="asset-item-main">
                      <div className="asset-item-info">
                        <div className="asset-item-name">
                          {asset.symbol && <span className="asset-symbol">{asset.symbol}</span>}
                          {asset.name}
                        </div>
                        <div className="asset-item-details">
                          {asset.quantity && (
                            <span className="asset-quantity">
                              {asset.quantity} {asset.symbol ? 'shares' : 'units'}
                            </span>
                          )}
                          {asset.purchasePrice && (
                            <span className="asset-purchase-price">
                              @ ${asset.purchasePrice.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="asset-item-value">
                        ${asset.value.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                    </div>
                    <div className="asset-item-actions">
                      <button
                        className="asset-action-btn"
                        onClick={() => setEditingId(asset.id)}
                        title="Edit"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        className="asset-action-btn danger"
                        onClick={() => handleDeleteAsset(asset.id)}
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    {editingId === asset.id && (
                      <AssetForm
                        asset={asset}
                        onSave={(updated) => {
                          updateAsset(asset.id, updated);
                          setEditingId(null);
                        }}
                        onCancel={() => setEditingId(null)}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        {assets.length === 0 && (
          <div className="asset-empty">
            <p>No assets added yet</p>
            <p className="empty-hint">Add assets to track your net worth</p>
          </div>
        )}
      </div>
    </div>
  );
});

interface AssetFormProps {
  asset?: Asset;
  onSave: (asset: Omit<Asset, 'id'>) => void;
  onCancel: () => void;
}

const AssetForm = memo(function AssetForm({ asset, onSave, onCancel }: AssetFormProps) {
  const [name, setName] = useState(asset?.name || '');
  const [type, setType] = useState<AssetType>(asset?.type || 'other');
  const [value, setValue] = useState(asset?.value.toString() || '0');
  const [quantity, setQuantity] = useState(asset?.quantity?.toString() || '');
  const [symbol, setSymbol] = useState(asset?.symbol || '');
  const [purchasePrice, setPurchasePrice] = useState(asset?.purchasePrice?.toString() || '');

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onSave({
        name,
        type,
        value: parseFloat(value) || 0,
        quantity: quantity ? parseFloat(quantity) : undefined,
        symbol: symbol || undefined,
        purchasePrice: purchasePrice ? parseFloat(purchasePrice) : undefined,
        purchaseDate: asset?.purchaseDate,
        currentPrice: asset?.currentPrice,
        accountId: asset?.accountId,
        notes: asset?.notes,
        tags: asset?.tags,
      });
    },
    [name, type, value, quantity, symbol, purchasePrice, asset, onSave]
  );

  return (
    <form className="asset-form" onSubmit={handleSubmit}>
      <div className="asset-form-row">
        <label>
          Name
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
        <label>
          Type
          <select value={type} onChange={(e) => setType(e.target.value as AssetType)} required>
            <option value="stock">Stock</option>
            <option value="etf">ETF</option>
            <option value="bond">Bond</option>
            <option value="mutual_fund">Mutual Fund</option>
            <option value="crypto">Crypto</option>
            <option value="real_estate">Real Estate</option>
            <option value="cash">Cash</option>
            <option value="domain">Domain</option>
            <option value="collectible">Collectible</option>
            <option value="other">Other</option>
          </select>
        </label>
      </div>
      <div className="asset-form-row">
        <label>
          Value ($)
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            required
            min="0"
            step="0.01"
          />
        </label>
        {(type === 'stock' || type === 'etf' || type === 'crypto') && (
          <>
            <label>
              Symbol
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="e.g., AAPL, BTC"
              />
            </label>
            <label>
              Quantity
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="0"
                step="0.0001"
              />
            </label>
            <label>
              Purchase Price ($)
              <input
                type="number"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                min="0"
                step="0.01"
              />
            </label>
          </>
        )}
      </div>
      <div className="asset-form-actions">
        <button type="submit" className="asset-form-save">
          Save
        </button>
        <button type="button" onClick={onCancel} className="asset-form-cancel">
          Cancel
        </button>
      </div>
    </form>
  );
});

export default AssetList;
