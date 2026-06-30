package com.smartstock.catalog.application.port;

import com.smartstock.catalog.domain.Product;
import java.util.List;

public interface ProductRepositoryPort {

  List<Product> list();

  Product save(Product product);
}
