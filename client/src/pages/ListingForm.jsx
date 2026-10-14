import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api, { getErrorMessage } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";

const EMPTY = { title: "", description: "", price: "", location: "", country: "" };

// Used for both "Add your place" (/listings/new) and "Edit listing" (/listings/:id/edit)
export default function ListingForm() {
  const { id } = useParams(); // only exists on the edit URL
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [form, setForm] = useState(EMPTY);
  const [image, setImage] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Editing: load the current values into the form
  useEffect(() => {
    if (!isEdit) return;
    api
      .get(`/listings/${id}`)
      .then(({ data }) => {
        if (data.owner?._id !== user.id) return navigate(`/listings/${id}`); // not yours
        const { title, description, price, location, country } = data;
        setForm({ title, description, price, location, country });
      })
      .catch((err) => setError(getErrorMessage(err)));
  }, [id, isEdit, navigate, user.id]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!isEdit && !image) return setError("Please choose a photo of the property");

    // Files can't be sent as JSON, so we use FormData (multipart/form-data)
    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => data.append(key, value));
    if (image) data.append("image", image);

    setSubmitting(true);
    try {
      const res = isEdit ? await api.put(`/listings/${id}`, data) : await api.post("/listings", data);
      navigate(`/listings/${res.data._id}`);
    } catch (err) {
      setError(getErrorMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <div className="container form-wrap">
      <form className="panel form-card" onSubmit={handleSubmit}>
        <h1>{isEdit ? "Edit your listing" : "Add your place"}</h1>

        <label className="field">
          <span>Title</span>
          <input name="title" value={form.title} onChange={handleChange} required maxLength={100} />
        </label>
        <label className="field">
          <span>Description</span>
          <textarea name="description" rows="4" value={form.description} onChange={handleChange} required />
        </label>
        <div className="field-row">
          <label className="field">
            <span>City or area</span>
            <input name="location" value={form.location} onChange={handleChange} required />
          </label>
          <label className="field">
            <span>Country</span>
            <input name="country" value={form.country} onChange={handleChange} required />
          </label>
        </div>
        <label className="field">
          <span>Price per night (INR)</span>
          <input name="price" type="number" min="0" value={form.price} onChange={handleChange} required />
        </label>
        <label className="field">
          <span>{isEdit ? "Replace photo (optional)" : "Photo"}</span>
          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => setImage(e.target.files[0])} />
        </label>

        {error && <p className="error-text" role="alert">{error}</p>}

        <button className="btn btn-primary" disabled={submitting}>
          {submitting ? "Saving…" : isEdit ? "Save changes" : "Create listing"}
        </button>
      </form>
    </div>
  );
}
