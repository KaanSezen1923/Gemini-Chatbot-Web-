import React, { useState } from 'react'

const UploadForm = ({onUpload,message}) => {
    const [file,setFile]=useState(null);
    const [loading,setLoading]= useState(false);

    const handleSubmit = async  (e) =>{
        e.preventDefault();
        if (!file) return ;
        setLoading(true);
        await onUpload(file);
        setLoading(false);
        setFile(null);
    }

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Upload Pdf</h2>
        <form onSubmit={handleSubmit}>
            <input 
            type='file'
            accept='application/pdf' 
            onChange={(e) => setFile(e.target.files[0])}
            className="mb-4 w-full p-2 border rounded"
            />

            <button
            type='submit'
            disabled={loading || !file}
            className="bg-blue-500 text-white p-2 rounded disabled:bg-gray-400"
            >
              {loading ? "Loading..." : "Upload"}
            </button>
            

        </form>

        {message && <p className="mt-2 text-green-600">{message}</p>}
      
    </div>
  )
}

export default UploadForm
