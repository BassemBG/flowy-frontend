"""File parsing service for Excel/CSV glossary files."""
import pandas as pd
from typing import List, Dict, Tuple
from io import BytesIO
import logging

logger = logging.getLogger(__name__)

# Column name mappings for flexible detection
TERM_COLUMNS = ["term", "word", "keyword", "name", "terme", "mot"]
DEFINITION_COLUMNS = ["definition", "description", "meaning", "explanation", "définition", "explication"]


def _detect_columns(df: pd.DataFrame) -> Tuple[str, str]:
    """
    Detect term and definition columns from dataframe.
    
    Args:
        df: Pandas DataFrame with Excel/CSV data
        
    Returns:
        Tuple of (term_column, definition_column) names
        
    Raises:
        ValueError: If required columns cannot be detected
    """
    columns_lower = {col.lower().strip(): col for col in df.columns}
    
    term_col = None
    def_col = None
    
    # Find term column
    for candidate in TERM_COLUMNS:
        for col_lower, col_original in columns_lower.items():
            if candidate in col_lower:
                term_col = col_original
                break
        if term_col:
            break
    
    # Find definition column
    for candidate in DEFINITION_COLUMNS:
        for col_lower, col_original in columns_lower.items():
            if candidate in col_lower:
                def_col = col_original
                break
        if def_col:
            break
    
    # Fallback: use first two columns if detection fails
    if not term_col or not def_col:
        cols = list(df.columns)
        if len(cols) >= 2:
            term_col = term_col or cols[0]
            def_col = def_col or cols[1]
            logger.warning(f"Column detection fallback: using '{term_col}' as term and '{def_col}' as definition")
        else:
            raise ValueError("Cannot detect term and definition columns. Expected columns with names like 'Term', 'Word', 'Definition', 'Description', etc.")
    
    logger.info(f"Detected columns: term='{term_col}', definition='{def_col}'")
    return term_col, def_col


def parse_file(file_content: bytes, filename: str) -> List[Dict]:
    """
    Parse an Excel or CSV file into a list of term/definition dictionaries.
    
    Args:
        file_content: Raw file bytes
        filename: Original filename (used to determine file type)
        
    Returns:
        List of {"term": ..., "definition": ...} dictionaries
        
    Raises:
        ValueError: If file format is not supported or columns cannot be detected
    """
    filename_lower = filename.lower()
    all_terms = []
    
    try:
        file_buffer = BytesIO(file_content)
        
        if filename_lower.endswith('.csv'):
            # CSV file - single sheet
            df = pd.read_csv(file_buffer)
            all_terms.extend(_process_dataframe(df, filename))
            
        elif filename_lower.endswith('.xlsx'):
            # Modern Excel format
            excel_file = pd.ExcelFile(file_buffer, engine='openpyxl')
            for sheet_name in excel_file.sheet_names:
                df = pd.read_excel(excel_file, sheet_name=sheet_name)
                terms = _process_dataframe(df, f"{filename}:{sheet_name}")
                all_terms.extend(terms)
                
        elif filename_lower.endswith('.xls'):
            # Legacy Excel format
            excel_file = pd.ExcelFile(file_buffer, engine='xlrd')
            for sheet_name in excel_file.sheet_names:
                df = pd.read_excel(excel_file, sheet_name=sheet_name)
                terms = _process_dataframe(df, f"{filename}:{sheet_name}")
                all_terms.extend(terms)
        else:
            raise ValueError(f"Unsupported file format: {filename}. Please upload .xlsx, .xls, or .csv files")
    
    except pd.errors.EmptyDataError:
        raise ValueError("The uploaded file is empty")
    except Exception as e:
        if "Unsupported" in str(e) or "Cannot detect" in str(e):
            raise
        logger.error(f"Error parsing file {filename}: {e}")
        raise ValueError(f"Error parsing file: {str(e)}")
    
    logger.info(f"Parsed {len(all_terms)} terms from {filename}")
    return all_terms


def _process_dataframe(df: pd.DataFrame, source: str) -> List[Dict]:
    """
    Process a single DataFrame into term/definition pairs.
    
    Args:
        df: Pandas DataFrame
        source: Source identifier for logging
        
    Returns:
        List of term/definition dictionaries
    """
    if df.empty:
        logger.warning(f"Empty dataframe in {source}")
        return []
    
    # Detect columns
    try:
        term_col, def_col = _detect_columns(df)
    except ValueError as e:
        logger.warning(f"Skipping {source}: {e}")
        return []
    
    # Fill NaN values
    df = df.fillna("")
    
    terms = []
    for _, row in df.iterrows():
        term = str(row[term_col]).strip()
        definition = str(row[def_col]).strip()
        
        # Skip empty rows
        if not term and not definition:
            continue
        
        # Use term as definition if definition is empty
        if not definition:
            definition = term
        # Use definition as term if term is empty
        if not term:
            term = definition[:50] + "..." if len(definition) > 50 else definition
        
        terms.append({
            "term": term,
            "definition": definition
        })
    
    logger.info(f"Processed {len(terms)} terms from {source}")
    return terms
